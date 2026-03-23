package com.ecommerce.controller;

import com.ecommerce.dto.request.ReviewRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.ReviewResponse;
import com.ecommerce.security.UserDetailsImpl;
import com.ecommerce.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products/{productId}/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getReviews(@PathVariable Long productId) {
        return ResponseEntity.ok(ApiResponse.success("Reviews retrieved", reviewService.getProductReviews(productId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ReviewResponse>> addReview(
            @PathVariable Long productId,
            @AuthenticationPrincipal UserDetailsImpl user,
            @Valid @RequestBody ReviewRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Review added", reviewService.addReview(user.getId(), productId, request)));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<ReviewResponse>> updateReview(
            @PathVariable Long productId,
            @AuthenticationPrincipal UserDetailsImpl user,
            @Valid @RequestBody ReviewRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Review updated", reviewService.updateReview(user.getId(), productId, request)));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> deleteReview(
            @PathVariable Long productId,
            @AuthenticationPrincipal UserDetailsImpl user) {
        reviewService.deleteReview(user.getId(), productId);
        return ResponseEntity.ok(ApiResponse.success("Review deleted"));
    }
}
