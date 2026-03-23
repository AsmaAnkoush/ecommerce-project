package com.ecommerce.service;

import com.ecommerce.dto.request.ReviewRequest;
import com.ecommerce.dto.response.ReviewResponse;
import com.ecommerce.entity.Product;
import com.ecommerce.entity.Review;
import com.ecommerce.entity.User;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.ReviewRepository;
import com.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    /** Customer-facing: only approved reviews */
    public List<ReviewResponse> getProductReviews(Long productId) {
        return reviewRepository.findByProductIdAndApprovedTrueOrderByCreatedAtDesc(productId)
                .stream().map(this::toResponse).toList();
    }

    /** Admin: all reviews across all products, paginated */
    public Page<ReviewResponse> getAllReviews(Pageable pageable) {
        return reviewRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::toResponse);
    }

    /** Admin: approve or hide a review */
    @Transactional
    public ReviewResponse setApproval(Long reviewId, boolean approved) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", reviewId));
        review.setApproved(approved);
        return toResponse(reviewRepository.save(review));
    }

    @Transactional
    public ReviewResponse addReview(Long userId, Long productId, ReviewRequest request) {
        if (reviewRepository.existsByUserIdAndProductId(userId, productId))
            throw new BadRequestException("You have already reviewed this product");

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));

        Review review = Review.builder()
                .user(user)
                .product(product)
                .rating(request.getRating())
                .comment(request.getComment())
                .build(); // approved defaults to false

        return toResponse(reviewRepository.save(review));
    }

    @Transactional
    public ReviewResponse updateReview(Long userId, Long productId, ReviewRequest request) {
        Review review = reviewRepository.findByUserIdAndProductId(userId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        review.setApproved(false); // reset — requires re-approval after edit
        return toResponse(reviewRepository.save(review));
    }

    @Transactional
    public void deleteReview(Long userId, Long productId) {
        Review review = reviewRepository.findByUserIdAndProductId(userId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));
        reviewRepository.delete(review);
    }

    private ReviewResponse toResponse(Review r) {
        return ReviewResponse.builder()
                .id(r.getId())
                .userId(r.getUser().getId())
                .userName(r.getUser().getFirstName() + " " + r.getUser().getLastName())
                .productId(r.getProduct().getId())
                .productName(r.getProduct().getName())
                .rating(r.getRating())
                .comment(r.getComment())
                .approved(r.getApproved())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
