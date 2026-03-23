package com.ecommerce.controller;

import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.ProductResponse;
import com.ecommerce.security.UserDetailsImpl;
import com.ecommerce.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getWishlist(@AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(ApiResponse.success("Wishlist retrieved", wishlistService.getWishlist(user.getId())));
    }

    @PostMapping("/{productId}")
    public ResponseEntity<ApiResponse<Void>> add(@AuthenticationPrincipal UserDetailsImpl user, @PathVariable Long productId) {
        wishlistService.addToWishlist(user.getId(), productId);
        return ResponseEntity.ok(ApiResponse.success("Added to wishlist"));
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<ApiResponse<Void>> remove(@AuthenticationPrincipal UserDetailsImpl user, @PathVariable Long productId) {
        wishlistService.removeFromWishlist(user.getId(), productId);
        return ResponseEntity.ok(ApiResponse.success("Removed from wishlist"));
    }

    @GetMapping("/{productId}/check")
    public ResponseEntity<ApiResponse<Boolean>> check(@AuthenticationPrincipal UserDetailsImpl user, @PathVariable Long productId) {
        return ResponseEntity.ok(ApiResponse.success("Check result", wishlistService.isInWishlist(user.getId(), productId)));
    }
}
