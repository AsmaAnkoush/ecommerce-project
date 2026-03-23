package com.ecommerce.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class GuestOrderRequest {

    @NotBlank
    private String customerName;

    private String customerPhone;

    @NotBlank
    private String shippingAddress;

    private String city;

    private String notes;

    private String paymentMethod;

    @NotEmpty
    private List<GuestOrderItemRequest> items;
}
