package com.ecommerce.dto.request;

import com.ecommerce.entity.DiscountType;
import com.ecommerce.entity.Season;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class ProductRequest {

    @NotBlank
    private String name;

    private String description;

    @Positive
    private BigDecimal price;

    private Season season;

    private DiscountType discountType;

    @PositiveOrZero
    private BigDecimal discountValue;

    @PositiveOrZero
    private Integer stockQuantity;

    private String imageUrl;

    private List<String> imageUrls;

    private String brand;

    private String size;

    private String color;

    private String material;

    private Boolean isBestSeller;

    private Boolean isNew;

    private Long categoryId;

    private List<ProductVariantRequest> variants;

    /** Per-color image groups; each entry has a color name and an ordered list of image URLs */
    private List<ColorImagesRequest> colorImages;
}
