package com.ecommerce.util;

import com.ecommerce.exception.BadRequestException;

/** Centralised guard for paginated query params. Keeps controllers terse and
 *  ensures every list endpoint rejects negative pages and absurd page sizes
 *  with a 400 instead of leaking a 500 from Spring Data. */
public final class PageRequestValidator {

    public static final int MAX_PAGE_SIZE = 100;

    private PageRequestValidator() {}

    public static void validate(int page, int size) {
        if (page < 0) {
            throw new BadRequestException("Page index must be 0 or greater");
        }
        if (size < 1 || size > MAX_PAGE_SIZE) {
            throw new BadRequestException("Page size must be between 1 and " + MAX_PAGE_SIZE);
        }
    }
}
