package com.ecommerce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShippingZoneResponse {
    private Long id;
    private String nameEn;
    private String nameAr;
    private BigDecimal price;
    private String deliveryDays;
    private String icon;
    private boolean active;
}
