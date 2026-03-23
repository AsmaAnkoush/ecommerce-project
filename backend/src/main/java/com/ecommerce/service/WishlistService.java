package com.ecommerce.service;

import com.ecommerce.dto.response.ProductResponse;
import com.ecommerce.entity.Product;
import com.ecommerce.entity.User;
import com.ecommerce.entity.WishlistItem;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.repository.WishlistItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistItemRepository wishlistItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ProductService productService;

    public List<ProductResponse> getWishlist(Long userId) {
        return wishlistItemRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(item -> productService.toResponse(item.getProduct()))
                .toList();
    }

    public boolean isInWishlist(Long userId, Long productId) {
        return wishlistItemRepository.existsByUserIdAndProductId(userId, productId);
    }

    @Transactional
    public void addToWishlist(Long userId, Long productId) {
        if (wishlistItemRepository.existsByUserIdAndProductId(userId, productId))
            throw new BadRequestException("Product already in wishlist");

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));

        wishlistItemRepository.save(WishlistItem.builder().user(user).product(product).build());
    }

    @Transactional
    public void removeFromWishlist(Long userId, Long productId) {
        wishlistItemRepository.deleteByUserIdAndProductId(userId, productId);
    }
}
