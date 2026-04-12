package com.ecommerce.service;

import com.ecommerce.dto.request.ColorImagesRequest;
import com.ecommerce.dto.request.ProductRequest;
import com.ecommerce.dto.request.ProductVariantRequest;
import com.ecommerce.dto.response.ProductResponse;
import com.ecommerce.dto.response.ProductVariantResponse;
import com.ecommerce.entity.Category;
import com.ecommerce.entity.DiscountType;
import com.ecommerce.entity.Season;
import com.ecommerce.entity.Product;
import com.ecommerce.entity.ProductImage;
import com.ecommerce.entity.ProductVariant;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.CartItemRepository;
import com.ecommerce.repository.CategoryRepository;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.ProductImageRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.ProductVariantRepository;
import com.ecommerce.repository.ReviewRepository;
import com.ecommerce.repository.WishlistItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductImageRepository productImageRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ReviewRepository reviewRepository;
    private final CartItemRepository cartItemRepository;
    private final WishlistItemRepository wishlistItemRepository;
    private final OrderRepository orderRepository;

    public Page<ProductResponse> findAll(Pageable pageable) {
        return productRepository.findByActiveTrue(pageable).map(this::toResponse);
    }

    public Page<ProductResponse> findByCategory(Long categoryId, Pageable pageable) {
        return productRepository.findByCategoryIdAndActiveTrue(categoryId, pageable).map(this::toResponse);
    }

    public Page<ProductResponse> search(String keyword, Pageable pageable) {
        return productRepository.searchProducts(keyword, pageable).map(this::toResponse);
    }

    public Page<ProductResponse> findWithFilters(Long categoryId, BigDecimal minPrice, BigDecimal maxPrice,
                                                  String color, String size, Pageable pageable) {
        return productRepository.findWithFilters(categoryId, minPrice, maxPrice, color, size, pageable)
                .map(this::toResponse);
    }

    public List<ProductResponse> findLatest() {
        return productRepository.findTop8ByActiveTrueOrderByCreatedAtDesc()
                .stream().map(this::toResponse).toList();
    }

    public List<ProductResponse> findNew() {
        return productRepository.findByActiveTrueAndIsNewTrueOrderByCreatedAtDesc()
                .stream().map(this::toResponse).toList();
    }

    public List<ProductResponse> findBestSellers() {
        return productRepository.findByActiveTrueAndIsBestSellerTrueOrderByConfirmedOrderCountDesc()
                .stream().map(this::toResponse).toList();
    }

    public List<ProductResponse> findBySeason(Season season) {
        List<Season> seasons = (season == Season.ALL_SEASON)
                ? List.of(Season.ALL_SEASON)
                : List.of(season, Season.ALL_SEASON);
        return productRepository.findByActiveTrueAndSeasonInOrderByCreatedAtDesc(seasons)
                .stream().map(this::toResponse).toList();
    }

    public List<ProductResponse> findOnSale() {
        return productRepository.findByActiveTrueAndDiscountPriceIsNotNull()
                .stream().map(this::toResponse).toList();
    }

    /** Customer-facing offers feed. Returns active products with any active
     *  discount (discountPrice not null OR discountValue > 0), sorted by the
     *  largest savings percentage first. */
    public List<ProductResponse> findOffers() {
        return productRepository.findActiveOffers().stream()
                .map(this::toResponse)
                .sorted(Comparator.comparingDouble(this::discountPercent).reversed())
                .toList();
    }

    /** Discount percentage as a 0..1 fraction. Falls back to 0 when there is
     *  no usable price/discount pair so the comparator stays well-defined. */
    private double discountPercent(ProductResponse p) {
        BigDecimal price = p.getPrice();
        BigDecimal discounted = p.getDiscountPrice();
        if (price == null || price.signum() <= 0 || discounted == null) return 0d;
        BigDecimal saved = price.subtract(discounted);
        if (saved.signum() <= 0) return 0d;
        return saved.divide(price, 4, RoundingMode.HALF_UP).doubleValue();
    }

    @Transactional
    public ProductResponse findById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        if (!product.getActive()) {
            throw new ResourceNotFoundException("Product", id);
        }
        product.setViewCount(product.getViewCount() + 1);
        productRepository.save(product);
        return toResponse(product);
    }

    public ProductResponse findByIdAdmin(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        return toResponse(product);
    }

    public Page<ProductResponse> findAllAdmin(Pageable pageable) {
        return productRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional
    public ProductResponse toggleVisibility(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        product.setActive(!product.getActive());
        return toResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        Product product = buildProduct(new Product(), request);
        Product saved = productRepository.save(product);
        saveImages(saved, request.getImageUrls());
        saveColorImages(saved, request.getColorImages());
        saveVariants(saved, request.getVariants());
        return toResponse(productRepository.findById(saved.getId()).orElseThrow());
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        buildProduct(product, request);

        if (request.getImageUrls() != null) {
            product.getImages().removeIf(img -> img.getColor() == null);
            AtomicInteger order = new AtomicInteger(0);
            request.getImageUrls().forEach(url -> product.getImages().add(
                    ProductImage.builder()
                            .product(product)
                            .imageUrl(url)
                            .color(null)
                            .sortOrder(order.getAndIncrement())
                            .isPrimary(order.get() == 1)
                            .build()
            ));
        }

        if (request.getColorImages() != null) {
            product.getImages().removeIf(img -> img.getColor() != null);
            request.getColorImages().forEach(group -> {
                if (group.getImageUrls() == null || group.getImageUrls().isEmpty()) return;
                AtomicInteger order = new AtomicInteger(0);
                group.getImageUrls().forEach(url -> product.getImages().add(
                        ProductImage.builder()
                                .product(product)
                                .imageUrl(url)
                                .color(group.getColor())
                                .sortOrder(order.getAndIncrement())
                                .isPrimary(order.get() == 1)
                                .build()
                ));
            });
        }

        if (request.getVariants() != null) {
            product.getVariants().clear();
            request.getVariants().forEach(req -> product.getVariants().add(
                    ProductVariant.builder()
                            .product(product)
                            .color(req.getColor())
                            .size(req.getSize())
                            .stockQuantity(req.getStockQuantity() != null ? req.getStockQuantity() : 0)
                            .chest(req.getChest())
                            .waist(req.getWaist())
                            .shoulders(req.getShoulders())
                            .backWidth(req.getBackWidth())
                            .length(req.getLength())
                            .build()
            ));
        }

        return toResponse(productRepository.save(product));
    }

    @Transactional
    public void delete(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));

        // Always safe to purge — these reference the product but carry no business history
        cartItemRepository.deleteByProductId(id);
        wishlistItemRepository.deleteByProductId(id);
        reviewRepository.deleteByProductId(id);

        // Order history must be preserved — if the product is referenced by any order
        // item, fall back to soft delete so receipts remain intact.
        if (orderRepository.countOrderItemsByProductId(id) > 0) {
            product.setActive(false);
            productRepository.save(product);
            return;
        }

        productImageRepository.deleteByProductId(id);
        productVariantRepository.deleteByProductId(id);
        productRepository.deleteById(id);
    }

    private void saveVariants(Product product, List<ProductVariantRequest> variantRequests) {
        if (variantRequests == null || variantRequests.isEmpty()) return;
        variantRequests.forEach(req -> productVariantRepository.save(
                ProductVariant.builder()
                        .product(product)
                        .color(req.getColor())
                        .size(req.getSize())
                        .stockQuantity(req.getStockQuantity() != null ? req.getStockQuantity() : 0)
                        .chest(req.getChest())
                        .waist(req.getWaist())
                        .shoulders(req.getShoulders())
                        .backWidth(req.getBackWidth())
                        .length(req.getLength())
                        .build()
        ));
    }

    private void saveImages(Product product, List<String> imageUrls) {
        if (imageUrls == null || imageUrls.isEmpty()) return;
        AtomicInteger order = new AtomicInteger(0);
        imageUrls.forEach(url -> productImageRepository.save(
                ProductImage.builder()
                        .product(product)
                        .imageUrl(url)
                        .color(null)
                        .sortOrder(order.getAndIncrement())
                        .isPrimary(order.get() == 1)
                        .build()
        ));
    }

    private void saveColorImages(Product product, List<ColorImagesRequest> colorImages) {
        if (colorImages == null || colorImages.isEmpty()) return;
        colorImages.forEach(group -> {
            if (group.getImageUrls() == null || group.getImageUrls().isEmpty()) return;
            AtomicInteger order = new AtomicInteger(0);
            group.getImageUrls().forEach(url -> productImageRepository.save(
                    ProductImage.builder()
                            .product(product)
                            .imageUrl(url)
                            .color(group.getColor())
                            .sortOrder(order.getAndIncrement())
                            .isPrimary(order.get() == 1)
                            .build()
            ));
        });
    }

    private Product buildProduct(Product product, ProductRequest request) {
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        if (request.getVariants() != null && !request.getVariants().isEmpty()) {
            int totalStock = request.getVariants().stream()
                    .mapToInt(v -> v.getStockQuantity() != null ? v.getStockQuantity() : 0)
                    .sum();
            product.setStockQuantity(totalStock);
        } else {
            product.setStockQuantity(request.getStockQuantity() != null ? request.getStockQuantity() : 0);
        }
        product.setImageUrl(request.getImageUrl());
        product.setBrand(request.getBrand());
        product.setSize(request.getSize());
        product.setColor(request.getColor());
        product.setMaterial(request.getMaterial());
        product.setIsBestSeller(request.getIsBestSeller() != null ? request.getIsBestSeller() : (product.getIsBestSeller() != null ? product.getIsBestSeller() : false));
        product.setIsNew(request.getIsNew() != null ? request.getIsNew() : (product.getIsNew() != null ? product.getIsNew() : false));
        product.setSeason(request.getSeason());

        applyDiscount(product, request);

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", request.getCategoryId()));
            product.setCategory(category);
        }
        return product;
    }

    private void applyDiscount(Product product, ProductRequest request) {
        DiscountType type = request.getDiscountType();
        BigDecimal value = request.getDiscountValue();
        BigDecimal price = request.getPrice() != null ? request.getPrice() : product.getPrice();

        if (type == null || value == null || value.compareTo(BigDecimal.ZERO) == 0) {
            product.setDiscountType(null);
            product.setDiscountValue(null);
            product.setDiscountPrice(null);
            return;
        }

        BigDecimal finalPrice;
        if (type == DiscountType.PERCENTAGE) {
            if (value.compareTo(BigDecimal.ZERO) <= 0 || value.compareTo(new BigDecimal("100")) >= 0) {
                throw new BadRequestException("Percentage discount must be between 0 and 100 (exclusive)");
            }
            finalPrice = price.subtract(price.multiply(value).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP));
        } else { // FIXED
            finalPrice = value;
            if (finalPrice.compareTo(BigDecimal.ZERO) <= 0 || finalPrice.compareTo(price) >= 0) {
                throw new BadRequestException("Fixed discount price must be greater than 0 and less than the original price");
            }
        }

        if (finalPrice.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Discount results in a non-positive final price");
        }

        product.setDiscountType(type);
        product.setDiscountValue(value);
        product.setDiscountPrice(finalPrice);
    }

    public ProductResponse toResponse(Product p) {
        List<String> imageUrls = p.getImages().stream()
                .filter(img -> img.getColor() == null)
                .sorted(Comparator.comparingInt(ProductImage::getSortOrder))
                .map(ProductImage::getImageUrl)
                .toList();

        // Build color → images map (preserving insertion order)
        Map<String, List<ProductResponse.ColorImageEntry>> colorImages = new LinkedHashMap<>();
        p.getImages().stream()
                .filter(img -> img.getColor() != null)
                .sorted(Comparator.comparingInt(ProductImage::getSortOrder))
                .forEach(img -> colorImages
                        .computeIfAbsent(img.getColor(), k -> new ArrayList<>())
                        .add(ProductResponse.ColorImageEntry.builder()
                                .url(img.getImageUrl())
                                .isPrimary(img.getIsPrimary())
                                .build()));

        List<ProductVariantResponse> variants = p.getVariants().stream()
                .map(v -> ProductVariantResponse.builder()
                        .id(v.getId())
                        .color(v.getColor())
                        .size(v.getSize())
                        .stockQuantity(v.getStockQuantity())
                        .chest(v.getChest())
                        .waist(v.getWaist())
                        .shoulders(v.getShoulders())
                        .backWidth(v.getBackWidth())
                        .length(v.getLength())
                        .build())
                .toList();

        Double avgRating = reviewRepository.findAverageRatingByProductId(p.getId());
        long reviewCount = reviewRepository.countByProductIdAndApprovedTrue(p.getId());

        return ProductResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .price(p.getPrice())
                .discountPrice(p.getDiscountPrice())
                .season(p.getSeason())
                .discountType(p.getDiscountType())
                .discountValue(p.getDiscountValue())
                .stockQuantity(p.getStockQuantity())
                .imageUrl(p.getImageUrl())
                .imageUrls(imageUrls)
                .brand(p.getBrand())
                .size(p.getSize())
                .color(p.getColor())
                .material(p.getMaterial())
                .active(p.getActive())
                .isBestSeller(p.getIsBestSeller())
                .confirmedOrderCount(p.getConfirmedOrderCount())
                .isNew(p.getIsNew())
                .categoryId(p.getCategory() != null ? p.getCategory().getId() : null)
                .categoryName(p.getCategory() != null ? p.getCategory().getName() : null)
                .variants(variants)
                .colorImages(colorImages.isEmpty() ? null : colorImages)
                .averageRating(avgRating)
                .reviewCount(reviewCount)
                .createdAt(p.getCreatedAt())
                .build();
    }
}
