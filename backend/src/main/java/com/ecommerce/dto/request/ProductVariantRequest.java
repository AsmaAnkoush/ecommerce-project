package com.ecommerce.dto.request;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductVariantRequest {
    private String color;  // free-form color name e.g. "Navy Blue", "Coral"
    private String size;   // e.g. "38", "S", "M"
    private Integer stockQuantity;

    // Measurements in cm (all optional)
    private BigDecimal chest;
    private BigDecimal waist;
    private BigDecimal shoulders;
    private BigDecimal backWidth;
    private BigDecimal length;
}
