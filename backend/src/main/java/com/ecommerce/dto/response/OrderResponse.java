package com.ecommerce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {

    private Long id;
    private List<OrderItemResponse> items;
    private BigDecimal totalAmount;
    private String status;
    private String shippingAddress;
    private String city;
    private String customerName;
    private String customerPhone;
    private String notes;
    private String paymentMethod;
    private String trackingNumber;
    private Boolean isGuest;
    private Boolean isArchived;
    private LocalDateTime createdAt;
    private String shippingZoneNameEn;
    private String shippingZoneNameAr;
    private BigDecimal shippingCost;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemResponse {
        private Long id;
        private Long productId;
        private String productName;
        private String productImage;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal subtotal;
        private String size;
        private String color;
        private String itemStatus;
    }
}
