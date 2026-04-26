package com.ecommerce.dto.request;

import com.ecommerce.entity.DiscountType;
import com.ecommerce.entity.Season;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class ProductRequest {

    @NotBlank(message = "Product name is required")
    @Size(min = 3, message = "Name must be at least 3 characters")
    private String name;

    private String description;

    @NotNull(message = "Price is required")
    @Positive(message = "Price must be greater than zero")
    @DecimalMin(value = "0.01", message = "Price must be at least 0.01")
    private BigDecimal price;

    @NotNull(message = "Season is required")
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

    @NotNull(message = "Category is required")
    private Long categoryId;

    @NotEmpty(message = "At least one size variant is required")
    @Valid
    private List<ProductVariantRequest> variants;

    /** Per-color image groups; each entry has a color name and an ordered list of image URLs */
    @NotEmpty(message = "At least one color with images is required")
    @Valid
    private List<ColorImagesRequest> colorImages;
}
