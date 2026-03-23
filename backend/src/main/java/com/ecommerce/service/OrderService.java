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

            if (product.getStockQuantity() < cartItem.getQuantity())
                throw new BadRequestException("Insufficient stock for: " + product.getName());

            product.setStockQuantity(product.getStockQuantity() - cartItem.getQuantity());
            productRepository.save(product);

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

    public List<OrderResponse> getUserOrders(Long userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toResponse).toList();
    }

    public Page<OrderResponse> getAllOrders(Pageable pageable) {
        return orderRepository.findAll(pageable).map(this::toResponse);
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

            if (product.getStockQuantity() < itemReq.getQuantity())
                throw new BadRequestException("Insufficient stock for: " + product.getName());

            product.setStockQuantity(product.getStockQuantity() - itemReq.getQuantity());
            productRepository.save(product);

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

    public OrderResponse getOrder(Long orderId, Long userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        if (order.getUser() == null || !order.getUser().getId().equals(userId))
            throw new BadRequestException("Order does not belong to this user");
        return toResponse(order);
    }

    public OrderResponse getOrderById(Long orderId) {
        return toResponse(orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId)));
    }

    @Transactional
    public OrderResponse updateStatus(Long orderId, Order.OrderStatus status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        order.setStatus(status);
        return toResponse(orderRepository.save(order));
    }

    public OrderResponse toResponse(Order order) {
        List<OrderResponse.OrderItemResponse> items = order.getItems().stream()
                .map(item -> {
                    // Use snapshot fields; fall back to live product only for old orders without snapshots
                    String name = item.getProductName() != null
                            ? item.getProductName() : item.getProduct().getName();
                    String image = item.getProductImage() != null
                            ? item.getProductImage() : item.getProduct().getImageUrl();
                    Long productId = item.getProduct() != null ? item.getProduct().getId() : null;
                    return OrderResponse.OrderItemResponse.builder()
                            .id(item.getId())
                            .productId(productId)
                            .productName(name)
                            .productImage(image)
                            .quantity(item.getQuantity())
                            .unitPrice(item.getUnitPrice())
                            .subtotal(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
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
