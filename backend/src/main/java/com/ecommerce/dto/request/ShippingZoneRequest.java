package com.ecommerce.dto.request;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class ShippingZoneRequest {
    private String nameEn;
    private String nameAr;
    private BigDecimal price;
    private String deliveryDays;
    private String icon;
    private Integer displayOrder;
}
