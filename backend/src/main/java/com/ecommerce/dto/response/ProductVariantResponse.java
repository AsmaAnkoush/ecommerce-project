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
public class ProductVariantResponse {
    private Long id;
    private String color;
    private String size;
    private Integer stockQuantity;

    // Measurements in cm (nullable)
    private BigDecimal chest;
    private BigDecimal waist;
    private BigDecimal shoulders;
    private BigDecimal backWidth;
    private BigDecimal length;
}
