package com.ecommerce.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class ColorImagesRequest {
    @NotBlank(message = "Color name is required")
    private String color;

    /** Ordered: position in this list = persisted sortOrder. */
    @NotEmpty(message = "Each color must have at least one image")
    private List<String> imageUrls;

    /** URL of the image admin chose as the main display image for this color.
     *  When null, the first image of the list is used. */
    private String primaryImageUrl;
}
