package com.ecommerce.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

import java.math.BigDecimal;

/** Body for PATCH /api/products/{id}/discount.
 *  A null discountPrice clears the discount; a non-null value must be ≥ 0
 *  and bounded so callers cannot pass NaN/Infinity through the JSON layer. */
@Data
public class DiscountRequest {

    @PositiveOrZero
    @DecimalMax("9999999.99")
    private BigDecimal discountPrice;
}
