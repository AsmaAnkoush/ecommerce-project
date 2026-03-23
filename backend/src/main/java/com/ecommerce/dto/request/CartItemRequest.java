package com.ecommerce.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class CartItemRequest {

    @NotNull
    private Long productId;

    @Positive
    private Integer quantity;

    private String size;

    private String color;
}
