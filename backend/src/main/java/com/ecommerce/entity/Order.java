package com.ecommerce.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Convert(converter = Order.OrderStatusConverter.class)
    @Column(nullable = false)
    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING;

    @Column(nullable = false)
    private String shippingAddress;

    private String city;

    private String customerName;

    private String customerPhone;

    @Column(columnDefinition = "TEXT")
    private String notes;

    private String paymentMethod;

    private String trackingNumber;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt;

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public enum OrderStatus {
        PENDING, CONFIRMED, CANCELLED;

        @com.fasterxml.jackson.annotation.JsonCreator
        public static OrderStatus fromValue(String value) {
            if (value == null) return PENDING;
            try {
                return OrderStatus.valueOf(value.toUpperCase());
            } catch (IllegalArgumentException e) {
                return PENDING;
            }
        }
    }

    @jakarta.persistence.Converter
    public static class OrderStatusConverter
            implements jakarta.persistence.AttributeConverter<OrderStatus, String> {

        @Override
        public String convertToDatabaseColumn(OrderStatus status) {
            return status == null ? OrderStatus.PENDING.name() : status.name();
        }

        @Override
        public OrderStatus convertToEntityAttribute(String dbValue) {
            return OrderStatus.fromValue(dbValue);
        }
    }
}
