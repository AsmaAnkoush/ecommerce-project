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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;

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

        order.setTotalAmount(total);
        orderRepository.save(order);
        cart.getItems().clear();
        cartRepository.save(cart);

        return toResponse(order);
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
        if (order.getStatus() != Order.OrderStatus.CONFIRMED && order.getStatus() != Order.OrderStatus.CANCELLED) {
            throw new BadRequestException("Only confirmed or cancelled orders can be archived");
        }
        order.setArchived(true);
        return toResponse(orderRepository.save(order));
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

        order.setTotalAmount(total);
        return toResponse(orderRepository.save(order));
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

    @Transactional
    public OrderResponse updateStatus(Long orderId, Order.OrderStatus status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

        Order.OrderStatus current = order.getStatus();

        // Validate transitions: only PENDING can change
        if (current == Order.OrderStatus.CONFIRMED) {
            throw new BadRequestException("Confirmed orders cannot be changed");
        }
        if (current == Order.OrderStatus.CANCELLED) {
            throw new BadRequestException("Cancelled orders cannot be changed");
        }
        // PENDING can only go to CONFIRMED or CANCELLED
        if (current == Order.OrderStatus.PENDING
                && status != Order.OrderStatus.CONFIRMED
                && status != Order.OrderStatus.CANCELLED) {
            throw new BadRequestException("Pending orders can only be confirmed or cancelled");
        }

        boolean becomingConfirmed = status == Order.OrderStatus.CONFIRMED;

        order.setStatus(status);
        orderRepository.save(order);

        if (becomingConfirmed) {
            for (OrderItem item : order.getItems()) {
                Product product = item.getProduct();
                if (product == null) continue;

                deductStock(product, item);

                long newCount = product.getConfirmedOrderCount() + 1;
                product.setConfirmedOrderCount(newCount);
                if (newCount >= BEST_SELLER_THRESHOLD) {
                    product.setIsBestSeller(true);
                }
                productRepository.save(product);
            }
        }

        return toResponse(order);
    }

    private void deductStock(Product product, OrderItem item) {
        int qty = item.getQuantity();
        String color = item.getColor();
        String size  = item.getSize();

        if (color != null && !color.isBlank() && size != null && !size.isBlank()) {
            // Variant-level deduction
            productVariantRepository
                    .findByProductIdAndColorIgnoreCaseAndSizeIgnoreCase(product.getId(), color, size)
                    .ifPresent(variant -> {
                        int newStock = Math.max(0, variant.getStockQuantity() - qty);
                        variant.setStockQuantity(newStock);
                        productVariantRepository.save(variant);
                    });

            // Recompute flat total from all variants
            int total = productVariantRepository.findByProductId(product.getId())
                    .stream().mapToInt(ProductVariant::getStockQuantity).sum();
            product.setStockQuantity(total);
        } else {
            // No variant info — deduct from flat stock, floor at 0
            int newStock = Math.max(0, product.getStockQuantity() - qty);
            product.setStockQuantity(newStock);
        }
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
                            .build();
                })
                .toList();

        return OrderResponse.builder()
                .id(order.getId())
                .items(items)
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus().name())
                .shippingAddress(order.getShippingAddress())
                .city(order.getCity())
                .customerName(order.getCustomerName())
                .customerPhone(order.getCustomerPhone())
                .notes(order.getNotes())
                .paymentMethod(order.getPaymentMethod())
                .trackingNumber(order.getTrackingNumber())
                .isGuest(order.getUser() == null)
                .createdAt(order.getCreatedAt())
                .build();
    }
}
