package com.ecommerce.dto.response;

import com.ecommerce.entity.DiscountType;
import com.ecommerce.entity.Season;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {

    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private BigDecimal discountPrice;
    private Season season;
    private DiscountType discountType;
    private BigDecimal discountValue;
    private Integer stockQuantity;
    private String imageUrl;
    private List<String> imageUrls;
    private String brand;
    private String size;
    private String color;
    private String material;
    private Boolean active;
    private Boolean isBestSeller;
    private Boolean isNew;
    private Long categoryId;
    private String categoryName;
    private List<ProductVariantResponse> variants;
    /** color → ordered list of images for that color (first = primary) */
    private Map<String, List<ColorImageEntry>> colorImages;
    private Double averageRating;
    private Long reviewCount;
    private LocalDateTime createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ColorImageEntry {
        private String url;
        private Boolean isPrimary;
    }
}
