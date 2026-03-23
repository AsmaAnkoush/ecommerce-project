package com.ecommerce.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class ColorImagesRequest {
    private String color;
    private List<String> imageUrls;
}
