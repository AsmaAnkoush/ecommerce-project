package com.ecommerce.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductVariantRequest {
    @NotBlank(message = "Variant color is required")
    private String color;  // free-form color name e.g. "Navy Blue", "Coral"

    @NotBlank(message = "Variant size is required")
    private String size;   // e.g. "38", "S", "M"

    @NotNull(message = "Variant stock quantity is required")
    @PositiveOrZero(message = "Stock quantity must be zero or greater")
    private Integer stockQuantity;

    // Measurements in cm (all optional)
    private BigDecimal shoulders;
    private BigDecimal chest;
    private BigDecimal waist;
    private BigDecimal hip;
    private BigDecimal length;
}
