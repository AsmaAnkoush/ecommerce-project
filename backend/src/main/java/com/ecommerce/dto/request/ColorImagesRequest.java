package com.ecommerce.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class ColorImagesRequest {
    private String color;
    /** Ordered: position in this list = persisted sortOrder. */
    private List<String> imageUrls;
    /** URL of the image admin chose as the main display image for this color.
     *  When null, the first image of the list is used. */
    private String primaryImageUrl;
}
