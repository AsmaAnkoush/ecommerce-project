package com.ecommerce.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OrderRequest {

    @NotBlank
    private String shippingAddress;

    private String city;

    @NotBlank
    private String customerName;

    private String customerPhone;

    private String notes;

    private String paymentMethod;
}
