package com.ecommerce.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class GuestOrderItemRequest {
    @NotNull @Positive
    private Long productId;

    @NotNull @Min(1) @Max(1000)
    private Integer quantity;

    private String size;
    private String color;
}
