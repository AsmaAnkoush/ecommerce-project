package com.ecommerce.service;

import com.ecommerce.dto.request.GuestOrderItemRequest;
import com.ecommerce.dto.request.GuestOrderRequest;
import com.ecommerce.dto.request.OrderRequest;
import com.ecommerce.dto.response.OrderResponse;
import com.ecommerce.entity.*;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.*;
import com.ecommerce.util.PhoneUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ShippingZoneRepository shippingZoneRepository;
    private final NotificationService notificationService;

    @Transactional
    public OrderResponse placeOrder(Long userId, OrderRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart not found for user: " + userId));

        if (cart.getItems().isEmpty()) throw new BadRequestException("Cart is empty");

        String phone = PhoneUtils.normalize(request.getCustomerPhone());
        PhoneUtils.validate(phone);

        Order order = Order.builder()
                .user(user)
                .shippingAddress(request.getShippingAddress())
                .city(request.getCity())
                .customerName(request.getCustomerName())
                .customerPhone(phone)
                .notes(request.getNotes())
                .paymentMethod(request.getPaymentMethod())
                .items(new ArrayList<>())
                .build();

        BigDecimal total = BigDecimal.ZERO;

        for (CartItem cartItem : cart.getItems()) {
            Product product = cartItem.getProduct();

            // Block placement if the requested quantity exceeds available stock.
            validateStockAvailable(product, cartItem.getColor(), cartItem.getSize(), cartItem.getQuantity());

            BigDecimal unitPrice = product.getDiscountPrice() != null ? product.getDiscountPrice() : product.getPrice();

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .productName(product.getName())
                    .productImage(product.getImageUrl())
                    .quantity(cartItem.getQuantity())
                    .unitPrice(unitPrice)
                    .size(cartItem.getSize())
                    .color(cartItem.getColor())
                    .build();

            order.getItems().add(orderItem);
            total = total.add(unitPrice.multiply(BigDecimal.valueOf(cartItem.getQuantity())));
        }

        if (request.getShippingZoneId() != null) {
            ShippingZone zone = shippingZoneRepository.findById(request.getShippingZoneId())
                    .orElseThrow(() -> new BadRequestException("Invalid shipping zone"));
            order.setShippingZone(zone);
            order.setShippingCost(zone.getPrice());
            total = total.add(zone.getPrice());
        }
        order.setTotalAmount(total);
        orderRepository.save(order);
        cart.getItems().clear();
        cartRepository.save(cart);
        notificationService.createOrderNotification(order);

        return toResponse(order);
    }

    /** Throws BadRequestException if not enough stock is available for the given variant.
     *  When color+size are provided we look at the matching ProductVariant; otherwise
     *  we fall back to the flat Product.stockQuantity. */
    private void validateStockAvailable(Product product, String color, String size, Integer qty) {
        if (product == null || qty == null || qty <= 0) {
            throw new BadRequestException("Invalid item quantity");
        }
        int available;
        if (color != null && !color.isBlank() && size != null && !size.isBlank()) {
            available = productVariantRepository
                    .findByProductIdAndColorIgnoreCaseAndSizeIgnoreCase(product.getId(), color, size)
                    .map(ProductVariant::getStockQuantity)
                    .orElse(0);
        } else {
            available = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
        }
        if (qty > available) {
            throw new BadRequestException(
                    "Not enough stock for \"" + product.getName() + "\" — available: " + available + ", requested: " + qty);
        }
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getUserOrders(Long userId) {
        return orderRepository.findByUserIdAndIsArchivedFalseOrderByCreatedAtDesc(userId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> getAllOrders(Pageable pageable) {
        return orderRepository.findByIsArchivedFalse(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> getArchivedOrders(Pageable pageable) {
        return orderRepository.findByIsArchivedTrue(pageable).map(this::toResponse);
    }

    @Transactional
    public OrderResponse archive(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        Order.OrderStatus s = order.getStatus();
        if (s != Order.OrderStatus.CONFIRMED
                && s != Order.OrderStatus.CANCELLED
                && s != Order.OrderStatus.PARTIALLY_CONFIRMED) { // PARTIALLY_CONFIRMED kept for backward DB compat
            throw new BadRequestException("Only confirmed or cancelled orders can be archived");
        }
        order.setArchived(true);
        return toResponse(orderRepository.save(order));
    }

    @Transactional
    public void deleteOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        orderRepository.delete(order);
    }

    @Transactional
    public OrderResponse placeGuestOrder(GuestOrderRequest request) {
        String guestPhone = PhoneUtils.normalize(request.getCustomerPhone());
        PhoneUtils.validate(guestPhone);

        Order order = Order.builder()
                .shippingAddress(request.getShippingAddress())
                .city(request.getCity())
                .customerName(request.getCustomerName())
                .customerPhone(guestPhone)
                .notes(request.getNotes())
                .paymentMethod(request.getPaymentMethod())
                .items(new ArrayList<>())
                .build();

        BigDecimal total = BigDecimal.ZERO;

        for (GuestOrderItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", itemReq.getProductId()));

            // Same stock guard as authenticated checkout — prevents over-ordering
            // and abuse of the public guest endpoint.
            validateStockAvailable(product, itemReq.getColor(), itemReq.getSize(), itemReq.getQuantity());

            BigDecimal unitPrice = product.getDiscountPrice() != null ? product.getDiscountPrice() : product.getPrice();

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .productName(product.getName())
                    .productImage(product.getImageUrl())
                    .quantity(itemReq.getQuantity())
                    .unitPrice(unitPrice)
                    .size(itemReq.getSize())
                    .color(itemReq.getColor())
                    .build();

            order.getItems().add(orderItem);
            total = total.add(unitPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity())));
        }

        if (request.getShippingZoneId() != null) {
            ShippingZone zone = shippingZoneRepository.findById(request.getShippingZoneId())
                    .orElseThrow(() -> new BadRequestException("Invalid shipping zone"));
            order.setShippingZone(zone);
            order.setShippingCost(zone.getPrice());
            total = total.add(zone.getPrice());
        }
        order.setTotalAmount(total);
        Order savedOrder = orderRepository.save(order);
        notificationService.createOrderNotification(savedOrder);
        return toResponse(savedOrder);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrder(Long orderId, Long userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        if (order.getUser() == null || !order.getUser().getId().equals(userId))
            throw new BadRequestException("Order does not belong to this user");
        return toResponse(order);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long orderId) {
        return toResponse(orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId)));
    }

    private static final int BEST_SELLER_THRESHOLD = 3;

    /**
     * Manual admin override for the whole-order status label.
     * Does NOT deduct or restore stock — all stock changes flow through
     * {@link #updateItemStatus} where each item is handled atomically.
     */
    @Transactional
    public OrderResponse updateStatus(Long orderId, Order.OrderStatus status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        order.setStatus(status);
        return toResponse(orderRepository.save(order));
    }

    /**
     * Update a single item's fulfillment status with full stock lifecycle:
     *
     * <ul>
     *   <li>PENDING → CONFIRMED — deducts the item's quantity from the matching
     *       variant (or flat product stock) using a pessimistic write lock.
     *   <li>PENDING → CANCELLED — no stock change (nothing was reserved or deducted).
     *   <li>CONFIRMED → CANCELLED — restores the previously deducted stock back to
     *       the variant (or flat product stock).
     *   <li>CANCELLED → anything — no-op; cancelled items are immutable.
     * </ul>
     *
     * After any change the parent order's status is re-derived from all its
     * items and persisted automatically.
     */
    @Transactional
    public OrderResponse updateItemStatus(Long orderId, Long itemId, ItemStatus newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

        OrderItem item = order.getItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Order item", itemId));

        log.info("[updateItemStatus] orderId={} itemId={} newStatus={} | size='{}' color='{}' productId={}",
                orderId, itemId, newStatus,
                item.getSize(), item.getColor(),
                item.getProduct() != null ? item.getProduct().getId() : "null");

        ItemStatus current = item.getItemStatus() != null ? item.getItemStatus() : ItemStatus.PENDING;

        // Cancelled items are terminal — never reopen them
        if (current == ItemStatus.CANCELLED) {
            throw new BadRequestException("Cancelled items cannot be changed");
        }
        // Confirming an already-confirmed item is a no-op
        if (current == ItemStatus.CONFIRMED && newStatus == ItemStatus.CONFIRMED) {
            return toResponse(order);
        }

        item.setItemStatus(newStatus);
        orderItemRepository.save(item);

        Product product = item.getProduct();

        if (newStatus == ItemStatus.CONFIRMED && current == ItemStatus.PENDING) {
            // PENDING → CONFIRMED: deduct stock
            if (product == null) {
                log.warn("[updateItemStatus] item {} has no linked product — skipping stock deduction", itemId);
            } else {
                deductStock(product, item);
                long newCount = (product.getConfirmedOrderCount() != null ? product.getConfirmedOrderCount() : 0L) + 1;
                product.setConfirmedOrderCount(newCount);
                if (newCount >= BEST_SELLER_THRESHOLD) product.setIsBestSeller(true);
                productRepository.save(product);
            }
        } else if (newStatus == ItemStatus.CANCELLED && current == ItemStatus.CONFIRMED) {
            // CONFIRMED → CANCELLED: restore stock that was previously deducted
            if (product == null) {
                log.warn("[updateItemStatus] item {} has no linked product — skipping stock restoration", itemId);
            } else {
                restoreStock(product, item);
                productRepository.save(product);
            }
        }
        // PENDING → CANCELLED: no stock change (nothing was ever deducted)

        // Re-derive and persist the order-level status from all item statuses
        order.setStatus(deriveOrderStatus(order.getItems()));
        orderRepository.save(order);

        return toResponse(order);
    }

    /**
     * Confirms every PENDING item in the order in one transaction.
     * Stock is deducted per item exactly as in {@link #updateItemStatus}.
     * Order status is re-derived once after all items are processed.
     */
    @Transactional
    public OrderResponse confirmAllItems(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

        for (OrderItem item : order.getItems()) {
            ItemStatus current = item.getItemStatus() != null ? item.getItemStatus() : ItemStatus.PENDING;
            if (current != ItemStatus.PENDING) continue;

            item.setItemStatus(ItemStatus.CONFIRMED);
            orderItemRepository.save(item);

            Product product = item.getProduct();
            if (product != null) {
                deductStock(product, item);
                long newCount = (product.getConfirmedOrderCount() != null ? product.getConfirmedOrderCount() : 0L) + 1;
                product.setConfirmedOrderCount(newCount);
                if (newCount >= BEST_SELLER_THRESHOLD) product.setIsBestSeller(true);
                productRepository.save(product);
            } else {
                log.warn("[confirmAllItems] item {} has no linked product — skipping stock deduction", item.getId());
            }
        }

        order.setStatus(deriveOrderStatus(order.getItems()));
        return toResponse(orderRepository.save(order));
    }

    /**
     * Cancels every non-cancelled item in the order in one transaction.
     * CONFIRMED → CANCELLED restores previously deducted stock.
     * PENDING → CANCELLED has no stock effect.
     * Order status is re-derived once after all items are processed.
     */
    @Transactional
    public OrderResponse cancelAllItems(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

        for (OrderItem item : order.getItems()) {
            ItemStatus current = item.getItemStatus() != null ? item.getItemStatus() : ItemStatus.PENDING;
            if (current == ItemStatus.CANCELLED) continue;

            item.setItemStatus(ItemStatus.CANCELLED);
            orderItemRepository.save(item);

            if (current == ItemStatus.CONFIRMED) {
                Product product = item.getProduct();
                if (product != null) {
                    restoreStock(product, item);
                    productRepository.save(product);
                } else {
                    log.warn("[cancelAllItems] item {} has no linked product — skipping stock restoration", item.getId());
                }
            }
        }

        order.setStatus(deriveOrderStatus(order.getItems()));
        return toResponse(orderRepository.save(order));
    }

    /** Derives the order-level status from the current itemStatus of all items. */
    private Order.OrderStatus deriveOrderStatus(List<OrderItem> items) {
        if (items == null || items.isEmpty()) return Order.OrderStatus.PENDING;
        boolean anyPending    = items.stream().anyMatch(i -> i.getItemStatus() == null || i.getItemStatus() == ItemStatus.PENDING);
        boolean allConfirmed  = items.stream().allMatch(i -> i.getItemStatus() == ItemStatus.CONFIRMED);
        boolean allCancelled  = items.stream().allMatch(i -> i.getItemStatus() == ItemStatus.CANCELLED);
        if (anyPending)   return Order.OrderStatus.PENDING;
        if (allConfirmed) return Order.OrderStatus.CONFIRMED;
        if (allCancelled) return Order.OrderStatus.CANCELLED;
        return Order.OrderStatus.PENDING;
    }

    /**
     * Deducts stock for one order item using pessimistic locking.
     *
     * Flow:
     *  1. If the item has colour+size → lock the matching ProductVariant row
     *     with SELECT FOR UPDATE (blocks any concurrent transaction trying to
     *     lock the same row), then re-validate stock inside the lock before
     *     decrementing.
     *  2. If no variant exists (or no colour+size) → lock the Product row
     *     instead and deduct from the flat stockQuantity.
     *
     * Throwing BadRequestException here rolls back the surrounding
     * @Transactional, which releases all locks acquired in this transaction.
     */
    private void deductStock(Product product, OrderItem item) {
        int qty = item.getQuantity() != null ? item.getQuantity() : 0;
        if (qty <= 0) {
            log.warn("[deductStock] item {} has qty={} — skipping", item.getId(), qty);
            return;
        }

        String color = item.getColor();
        String size  = item.getSize();

        log.info("[deductStock] productId={} size='{}' color='{}' qty={}",
                product.getId(), size, color, qty);

        if (color != null && !color.isBlank() && size != null && !size.isBlank()) {
            // ── Variant path — acquire row-level write lock ────────────────
            var variantOpt = productVariantRepository.findForUpdate(product.getId(), color, size);

            if (variantOpt.isPresent()) {
                ProductVariant variant = variantOpt.get();
                // Re-check stock inside the lock — the pre-placement check may now be stale
                int current = variant.getStockQuantity() != null ? variant.getStockQuantity() : 0;
                if (current < qty) {
                    throw new BadRequestException(
                            "Not enough stock for \"" + product.getName() + "\" (" + color + " / " + size + ")"
                            + " — available: " + current + ", requested: " + qty);
                }
                variant.setStockQuantity(current - qty);
                productVariantRepository.save(variant);

                // Sync flat total from all variants
                int total = productVariantRepository.findByProductId(product.getId())
                        .stream()
                        .mapToInt(v -> v.getStockQuantity() != null ? v.getStockQuantity() : 0)
                        .sum();
                product.setStockQuantity(total);
                return;
            }

            log.warn("[deductStock] no variant found for productId={} color='{}' size='{}' — falling back to flat stock",
                    product.getId(), color, size);
            // Fall through to flat-stock path
        }

        // ── Flat-stock path — lock the product row ─────────────────────────
        Product locked = productRepository.findByIdForUpdate(product.getId()).orElse(product);
        int flat = locked.getStockQuantity() != null ? locked.getStockQuantity() : 0;
        if (flat < qty) {
            throw new BadRequestException(
                    "Not enough stock for \"" + product.getName() + "\""
                    + " — available: " + flat + ", requested: " + qty);
        }
        locked.setStockQuantity(flat - qty);
    }

    /**
     * Reverses a previous stock deduction for one order item.
     * Mirrors {@link #deductStock}: uses the same variant-first, flat-fallback
     * logic and the same pessimistic write lock so concurrent operations on the
     * same row serialize correctly.
     */
    private void restoreStock(Product product, OrderItem item) {
        int qty = item.getQuantity() != null ? item.getQuantity() : 0;
        if (qty <= 0) {
            log.warn("[restoreStock] item {} has qty={} — skipping", item.getId(), qty);
            return;
        }

        String color = item.getColor();
        String size  = item.getSize();

        log.info("[restoreStock] productId={} size='{}' color='{}' qty={}",
                product.getId(), size, color, qty);

        if (color != null && !color.isBlank() && size != null && !size.isBlank()) {
            var variantOpt = productVariantRepository.findForUpdate(product.getId(), color, size);
            if (variantOpt.isPresent()) {
                ProductVariant variant = variantOpt.get();
                variant.setStockQuantity((variant.getStockQuantity() != null ? variant.getStockQuantity() : 0) + qty);
                productVariantRepository.save(variant);
                int total = productVariantRepository.findByProductId(product.getId())
                        .stream()
                        .mapToInt(v -> v.getStockQuantity() != null ? v.getStockQuantity() : 0)
                        .sum();
                product.setStockQuantity(total);
                return;
            }
            log.warn("[restoreStock] no variant found for productId={} color='{}' size='{}' — falling back to flat stock",
                    product.getId(), color, size);
        }

        // Flat-stock path
        Product locked = productRepository.findByIdForUpdate(product.getId()).orElse(product);
        locked.setStockQuantity((locked.getStockQuantity() != null ? locked.getStockQuantity() : 0) + qty);
    }

    public OrderResponse toResponse(Order order) {
        List<OrderResponse.OrderItemResponse> items = order.getItems().stream()
                .map(item -> {
                    Product product = item.getProduct();
                    // Use snapshot fields; fall back to live product only for old orders without snapshots
                    String name = item.getProductName() != null
                            ? item.getProductName()
                            : (product != null ? product.getName() : "Unknown Product");
                    // Prefer the variant-specific image matching the ordered color, then snapshot, then live product image.
                    String variantImage = null;
                    if (product != null && item.getColor() != null && product.getImages() != null) {
                        variantImage = product.getImages().stream()
                                .filter(img -> img.getColor() != null && img.getColor().equalsIgnoreCase(item.getColor()))
                                .map(com.ecommerce.entity.ProductImage::getImageUrl)
                                .findFirst()
                                .orElse(null);
                    }
                    String image = variantImage != null
                            ? variantImage
                            : (item.getProductImage() != null
                                ? item.getProductImage()
                                : (product != null ? product.getImageUrl() : null));
                    Long productId = product != null ? product.getId() : null;
                    BigDecimal unitPrice = item.getUnitPrice() != null
                            ? item.getUnitPrice() : BigDecimal.ZERO;
                    return OrderResponse.OrderItemResponse.builder()
                            .id(item.getId())
                            .productId(productId)
                            .productName(name)
                            .productImage(image)
                            .quantity(item.getQuantity())
                            .unitPrice(unitPrice)
                            .subtotal(unitPrice.multiply(BigDecimal.valueOf(
                                    item.getQuantity() != null ? item.getQuantity() : 0)))
                            .size(item.getSize())
                            .color(item.getColor())
                            .itemStatus(item.getItemStatus() != null
                                    ? item.getItemStatus().name()
                                    : ItemStatus.PENDING.name())
                            .build();
                })
                .toList();

        return OrderResponse.builder()
                .id(order.getId())
                .items(items)
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus() == Order.OrderStatus.PARTIALLY_CONFIRMED
                        ? Order.OrderStatus.PENDING.name()
                        : order.getStatus().name())
                .shippingAddress(order.getShippingAddress())
                .city(order.getCity())
                .customerName(order.getCustomerName())
                .customerPhone(order.getCustomerPhone())
                .notes(order.getNotes())
                .paymentMethod(order.getPaymentMethod())
                .trackingNumber(order.getTrackingNumber())
                .isGuest(order.getUser() == null)
                .isArchived(order.isArchived())
                .createdAt(order.getCreatedAt())
                .shippingZoneNameEn(order.getShippingZone() != null ? order.getShippingZone().getNameEn() : null)
                .shippingZoneNameAr(order.getShippingZone() != null ? order.getShippingZone().getNameAr() : null)
                .shippingZoneDeliveryDays(order.getShippingZone() != null ? order.getShippingZone().getDeliveryDays() : null)
                .shippingCost(order.getShippingCost())
                .build();
    }
}
