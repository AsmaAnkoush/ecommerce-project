package com.ecommerce.dto.request;

import lombok.Data;

@Data
public class GuestOrderItemRequest {
    private Long productId;
    private Integer quantity;
    private String size;
    private String color;
}
