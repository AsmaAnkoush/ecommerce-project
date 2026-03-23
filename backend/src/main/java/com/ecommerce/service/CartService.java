package com.ecommerce.service;

import com.ecommerce.dto.request.CartItemRequest;
import com.ecommerce.dto.response.CartResponse;
import com.ecommerce.entity.Cart;
import com.ecommerce.entity.CartItem;
import com.ecommerce.entity.Product;
import com.ecommerce.entity.User;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.CartItemRepository;
import com.ecommerce.repository.CartRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public CartResponse getCart(Long userId) {
        return toResponse(getOrCreateCart(userId));
    }

    @Transactional
    public CartResponse addItem(Long userId, CartItemRequest request) {
        Cart cart = getOrCreateCart(userId);

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", request.getProductId()));

        if (!product.getActive()) {
            throw new BadRequestException("Product is not available");
        }
        if (product.getStockQuantity() < request.getQuantity()) {
            throw new BadRequestException("Insufficient stock");
        }

        Optional<CartItem> existing = cartItemRepository.findVariant(
                cart.getId(), product.getId(), request.getSize(), request.getColor());

        if (existing.isPresent()) {
            CartItem item = existing.get();
            item.setQuantity(item.getQuantity() + request.getQuantity());
            cartItemRepository.save(item);
        } else {
            CartItem item = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(request.getQuantity())
                    .size(request.getSize())
                    .color(request.getColor())
                    .build();
            cart.getItems().add(item);
            cartItemRepository.save(item);
        }

        return toResponse(cartRepository.findByUserId(userId).orElseThrow());
    }

    @Transactional
    public CartResponse updateItem(Long userId, Long itemId, Integer quantity) {
        Cart cart = getOrCreateCart(userId);

        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new BadRequestException("Cart item does not belong to this user");
        }

        if (quantity <= 0) {
            cartItemRepository.delete(item);
        } else {
            item.setQuantity(quantity);
            cartItemRepository.save(item);
        }

        return toResponse(cartRepository.findByUserId(userId).orElseThrow());
    }

    @Transactional
    public CartResponse removeItem(Long userId, Long itemId) {
        Cart cart = getOrCreateCart(userId);

        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new BadRequestException("Cart item does not belong to this user");
        }

        cartItemRepository.delete(item);
        return toResponse(cartRepository.findByUserId(userId).orElseThrow());
    }

    @Transactional
    public void clearCart(Long userId) {
        Cart cart = getOrCreateCart(userId);
        cart.getItems().clear();
        cartRepository.save(cart);
    }

    @Transactional
    private Cart getOrCreateCart(Long userId) {
        return cartRepository.findByUserId(userId).orElseGet(() -> {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", userId));
            return cartRepository.save(Cart.builder().user(user).build());
        });
    }

    private CartResponse toResponse(Cart cart) {
        List<CartResponse.CartItemResponse> items = cart.getItems().stream()
                .map(item -> {
                    BigDecimal price = item.getProduct().getDiscountPrice() != null
                            ? item.getProduct().getDiscountPrice()
                            : item.getProduct().getPrice();
                    return CartResponse.CartItemResponse.builder()
                            .id(item.getId())
                            .productId(item.getProduct().getId())
                            .productName(item.getProduct().getName())
                            .productImage(item.getProduct().getImageUrl())
                            .unitPrice(price)
                            .quantity(item.getQuantity())
                            .subtotal(price.multiply(BigDecimal.valueOf(item.getQuantity())))
                            .size(item.getSize())
                            .color(item.getColor())
                            .build();
                })
                .toList();

        BigDecimal total = items.stream()
                .map(CartResponse.CartItemResponse::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return CartResponse.builder()
                .id(cart.getId())
                .items(items)
                .totalPrice(total)
                .totalItems(items.stream().mapToInt(CartResponse.CartItemResponse::getQuantity).sum())
                .build();
    }
}
