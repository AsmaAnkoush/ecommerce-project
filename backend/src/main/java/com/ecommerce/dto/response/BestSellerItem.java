package com.ecommerce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BestSellerItem {
    private Long productId;
    private String productName;
    private String productImage;
    private Long totalSold;
}
