package com.ecommerce.service;

import com.ecommerce.dto.request.ColorImagesRequest;
import com.ecommerce.dto.request.ProductRequest;
import com.ecommerce.dto.request.ProductVariantRequest;
import com.ecommerce.dto.response.ProductResponse;
import com.ecommerce.dto.response.ProductVariantResponse;
import com.ecommerce.entity.Category;
import com.ecommerce.entity.DiscountType;
import com.ecommerce.entity.Order;
import com.ecommerce.entity.ProductSeason;
import com.ecommerce.entity.Product;
import com.ecommerce.entity.ProductImage;
import com.ecommerce.entity.ProductVariant;
import com.ecommerce.entity.Season;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.CartItemRepository;
import com.ecommerce.repository.CategoryRepository;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.ProductImageRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.ProductVariantRepository;
import com.ecommerce.repository.ReviewRepository;
import com.ecommerce.repository.SeasonRepository;
import com.ecommerce.repository.WishlistItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SeasonRepository seasonRepository;
    private final ProductImageRepository productImageRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ReviewRepository reviewRepository;
    private final CartItemRepository cartItemRepository;
    private final WishlistItemRepository wishlistItemRepository;
    private final OrderRepository orderRepository;

    public Page<ProductResponse> findAll(Pageable pageable) {
        return mapPageWithStats(productRepository.findByActiveTrueAndIsDeletedFalse(pageable));
    }

    public Page<ProductResponse> findByCategory(Long categoryId, Pageable pageable) {
        return mapPageWithStats(productRepository.findByCategoryIdAndActiveTrueAndIsDeletedFalse(categoryId, pageable));
    }

    public Page<ProductResponse> search(String keyword, Pageable pageable) {
        return mapPageWithStats(productRepository.searchProducts(keyword, pageable));
    }

    public Page<ProductResponse> findWithFilters(Long categoryId, BigDecimal minPrice, BigDecimal maxPrice,
                                                  String color, String size, Pageable pageable) {
        return mapPageWithStats(productRepository.findWithFilters(categoryId, minPrice, maxPrice, color, size, pageable));
    }

    public List<ProductResponse> findLatest() {
        return toResponses(productRepository.findTop8ByActiveTrueAndIsDeletedFalseOrderByCreatedAtDesc());
    }

    /**
     * Dynamic "new arrivals": active, non-deleted products created within the
     * last 3 days. When {@code season} is non-null only that season (+ ALL_SEASON)
     * is included; when null all seasons are returned (no calendar fallback).
     */
    public List<ProductResponse> findNew(ProductSeason season, int limit) {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(3);
        List<Product> raw;
        if (season != null) {
            List<ProductSeason> seasons = List.of(season, ProductSeason.ALL_SEASON);
            raw = productRepository
                    .findByActiveTrueAndIsDeletedFalseAndSeasonInAndCreatedAtAfterOrderByCreatedAtDesc(seasons, cutoff);
        } else {
            raw = productRepository
                    .findByActiveTrueAndIsDeletedFalseAndCreatedAtAfterOrderByCreatedAtDesc(cutoff);
        }
        List<Product> limited = limit > 0 ? raw.stream().limit(limit).toList() : raw;
        return toResponses(limited);
    }

    /**
     * Live best-sellers ranked by total units sold in CONFIRMED orders.
     * When {@code season} is null all seasons qualify; otherwise only the given
     * season (+ ALL_SEASON tagged products) are included. {@code limit} caps the
     * result (0 = unlimited).
     */
    public List<ProductResponse> findBestSellers(ProductSeason season, int limit) {
        Pageable pageable = limit > 0
                ? PageRequest.of(0, limit)
                : Pageable.unpaged();
        List<Object[]> rows = productRepository.findBestSellersByConfirmedQuantity(
                Order.OrderStatus.CONFIRMED, season, ProductSeason.ALL_SEASON, pageable);
        Map<Long, double[]> stats = new java.util.HashMap<>();
        List<Product> products = new ArrayList<>();
        for (Object[] row : rows) {
            Product p = (Product) row[0];
            products.add(p);
            // row[1] is the live unit count — store it temporarily keyed by id
            stats.put(p.getId(), new double[]{ Double.NaN, 0, ((Number) row[1]).doubleValue() });
        }
        // Batch-load review stats then merge live unit count
        Map<Long, double[]> reviewStats = fetchStats(products);
        return products.stream().map(p -> {
            double[] rev = reviewStats.get(p.getId());
            double[] live = stats.get(p.getId());
            double[] merged = new double[]{
                rev != null ? rev[0] : Double.NaN,
                rev != null ? rev[1] : 0,
                live != null ? live[2] : 0
            };
            ProductResponse r = toResponse(p, merged);
            // Overwrite confirmedOrderCount with the live aggregated units sold
            r.setConfirmedOrderCount((long) merged[2]);
            return r;
        }).toList();
    }

    public List<ProductResponse> findBySeason(ProductSeason season) {
        List<ProductSeason> seasons = (season == ProductSeason.ALL_SEASON)
                ? List.of(ProductSeason.ALL_SEASON)
                : List.of(season, ProductSeason.ALL_SEASON);
        return toResponses(productRepository.findByActiveTrueAndSeasonInAndIsDeletedFalseOrderByCreatedAtDesc(seasons));
    }

    /** Looks up the Season entity by its PK, then delegates to findBySeason.
     *  Allows the public homepage to filter by season ID (mirrors category-by-ID). */
    public List<ProductResponse> findBySeasonId(Long seasonId) {
        Season season = seasonRepository.findById(seasonId)
                .orElseThrow(() -> new ResourceNotFoundException("Season", seasonId));
        String key = season.getSeasonKey();
        if (key == null || key.isBlank()) {
            return List.of();
        }
        try {
            return findBySeason(ProductSeason.valueOf(key.toUpperCase()));
        } catch (IllegalArgumentException e) {
            return List.of();
        }
    }

    public List<ProductResponse> findOnSale() {
        return toResponses(productRepository.findByActiveTrueAndDiscountPriceIsNotNullAndIsDeletedFalse());
    }

    /** Customer-facing offers feed. Returns active products with any active
     *  discount (discountPrice not null OR discountValue > 0), sorted by the
     *  largest savings percentage first. */
    public List<ProductResponse> findOffers() {
        return toResponses(productRepository.findActiveOffers()).stream()
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
        if (Boolean.TRUE.equals(product.getIsDeleted()) || !product.getActive()) {
            throw new ResourceNotFoundException("Product", id);
        }
        // @PostLoad coalesces nulls, but be defensive in case the entity was
        // constructed without going through Hibernate's lifecycle.
        long currentViews = product.getViewCount() != null ? product.getViewCount() : 0L;
        product.setViewCount(currentViews + 1);
        productRepository.save(product);
        return toResponse(product);
    }

    public ProductResponse findByIdAdmin(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        if (Boolean.TRUE.equals(product.getIsDeleted())) {
            throw new ResourceNotFoundException("Product", id);
        }
        return toResponse(product);
    }

    public Page<ProductResponse> findAllAdmin(Pageable pageable) {
        return mapPageWithStats(productRepository.findByIsDeletedFalse(pageable));
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> findOutOfStockAdmin(Pageable pageable) {
        log.debug("[Stock] fetching out-of-stock products, pageable={}", pageable);
        try {
            Page<Product> page = productRepository.findOutOfStock(0, pageable);
            log.debug("[Stock] out-of-stock query returned {} items", page.getTotalElements());
            return mapPageWithStats(page);
        } catch (Exception e) {
            log.error("[Stock] findOutOfStockAdmin failed: {}", e.getMessage(), e);
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> findLowStockAdmin(Pageable pageable, int threshold) {
        log.debug("[Stock] fetching low-stock products (0 < qty < {}), pageable={}", threshold, pageable);
        try {
            Page<Product> page = productRepository.findLowStock(0, threshold, pageable);
            log.debug("[Stock] low-stock query returned {} items", page.getTotalElements());
            return mapPageWithStats(page);
        } catch (Exception e) {
            log.error("[Stock] findLowStockAdmin failed: {}", e.getMessage(), e);
            throw e;
        }
    }

    /** Admin-side offers list — returns every product (active or hidden) that has a discount. */
    public List<ProductResponse> findAllOffersAdmin() {
        return toResponses(productRepository.findAllWithDiscount()).stream()
                .sorted(Comparator.comparingDouble(this::discountPercent).reversed())
                .toList();
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
        validateForSubmission(request);
        Product product = buildProduct(new Product(), request);
        Product saved = productRepository.save(product);
        saveImages(saved, request.getImageUrls());
        saveColorImages(saved, request.getColorImages());
        saveVariants(saved, request.getVariants());
        return toResponse(productRepository.findById(saved.getId()).orElseThrow());
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        validateForSubmission(request);
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
                            .shoulders(req.getShoulders())
                            .chest(req.getChest())
                            .waist(req.getWaist())
                            .hip(req.getHip())
                            .length(req.getLength())
                            .build()
            ));
        }

        return toResponse(productRepository.save(product));
    }

    /**
     * Hard guard against incomplete products. Mirrors the admin form's
     * front-end checks so the database can never end up with half-populated
     * rows even if a request bypasses the UI. Throws BadRequestException
     * (→ 400) with a single, human-readable message.
     */
    private void validateForSubmission(ProductRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new BadRequestException("Product name is required");
        }
        if (request.getDescription() == null || request.getDescription().isBlank()) {
            throw new BadRequestException("Description is required");
        }
        if (request.getPrice() == null || request.getPrice().signum() <= 0) {
            throw new BadRequestException("Product price must be greater than zero");
        }
        if (request.getCategoryId() == null) {
            throw new BadRequestException("Category is required");
        }
        if (request.getSeason() == null) {
            throw new BadRequestException("Season is required");
        }
        if (request.getSeason() != ProductSeason.SUMMER
                && request.getSeason() != ProductSeason.WINTER) {
            throw new BadRequestException("Season must be SUMMER or WINTER");
        }
        if (request.getColorImages() == null || request.getColorImages().isEmpty()) {
            throw new BadRequestException("At least one color is required");
        }
        for (ColorImagesRequest group : request.getColorImages()) {
            if (group.getColor() == null || group.getColor().isBlank()) {
                throw new BadRequestException("Each color entry must have a color name");
            }
            if (group.getImageUrls() == null || group.getImageUrls().isEmpty()) {
                throw new BadRequestException("Color \"" + group.getColor() + "\" needs at least one image");
            }
        }
        if (request.getVariants() == null || request.getVariants().isEmpty()) {
            throw new BadRequestException("At least one size variant is required");
        }
        for (ProductVariantRequest v : request.getVariants()) {
            if (v.getColor() == null || v.getColor().isBlank()) {
                throw new BadRequestException("Each size variant must reference a color");
            }
            if (v.getSize() == null || v.getSize().toString().isBlank()) {
                throw new BadRequestException("Each size variant must have a size");
            }
            if (v.getStockQuantity() == null || v.getStockQuantity() < 0) {
                throw new BadRequestException("Size \"" + v.getSize() + "\" (" + v.getColor() + ") stock quantity must be zero or greater");
            }
        }
    }

    /** Apply or clear an offer on a single product. Pass null to remove the discount. */
    @Transactional
    public ProductResponse setDiscountPrice(Long id, BigDecimal discountPrice) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        if (discountPrice != null) {
            if (discountPrice.signum() <= 0) {
                throw new BadRequestException("Discount price must be greater than zero");
            }
            if (product.getPrice() != null && discountPrice.compareTo(product.getPrice()) >= 0) {
                throw new BadRequestException("Discount price must be less than the original price");
            }
        }
        product.setDiscountPrice(discountPrice);
        return toResponse(productRepository.save(product));
    }

    /**
     * Soft-delete: tombstones the product so historical order_items, reviews,
     * etc. keep working (refunds, accounting, customer order history all stay
     * intact), but it disappears from every public and admin listing.
     *
     * Cart and wishlist entries are still purged because they only represent
     * "intent to buy" — keeping deleted products in users' carts would let
     * them check out something that no longer exists.
     */
    @Transactional
    public void delete(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        if (Boolean.TRUE.equals(product.getIsDeleted())) {
            return; // already tombstoned — idempotent
        }
        // Drop transient references that would let users buy a tombstoned product.
        cartItemRepository.deleteByProductId(id);
        wishlistItemRepository.deleteByProductId(id);

        // Hide from listings and (for safety) from active-only product feeds.
        product.setIsDeleted(true);
        product.setActive(false);
        productRepository.save(product);
    }

    private void saveVariants(Product product, List<ProductVariantRequest> variantRequests) {
        if (variantRequests == null || variantRequests.isEmpty()) return;
        variantRequests.forEach(req -> productVariantRepository.save(
                ProductVariant.builder()
                        .product(product)
                        .color(req.getColor())
                        .size(req.getSize())
                        .stockQuantity(req.getStockQuantity() != null ? req.getStockQuantity() : 0)
                        .shoulders(req.getShoulders())
                        .chest(req.getChest())
                        .waist(req.getWaist())
                        .hip(req.getHip())
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
            // Explicit primary if the admin picked one and it's still in the list,
            // otherwise the first image takes the role.
            String requestedPrimary = group.getPrimaryImageUrl();
            String effectivePrimary = (requestedPrimary != null && group.getImageUrls().contains(requestedPrimary))
                    ? requestedPrimary
                    : group.getImageUrls().get(0);
            AtomicInteger order = new AtomicInteger(0);
            group.getImageUrls().forEach(url -> productImageRepository.save(
                    ProductImage.builder()
                            .product(product)
                            .imageUrl(url)
                            .color(group.getColor())
                            .sortOrder(order.getAndIncrement())
                            .isPrimary(url.equals(effectivePrimary))
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

    /** Batch-load review stats once for the whole list, eliminating N+1. */
    private Map<Long, double[]> fetchStats(List<Product> products) {
        if (products == null || products.isEmpty()) return Map.of();
        List<Long> ids = products.stream().map(Product::getId).toList();
        Map<Long, double[]> map = new java.util.HashMap<>();
        for (Object[] row : reviewRepository.findRatingStatsForProducts(ids)) {
            Long pid = (Long) row[0];
            Double avg = row[1] == null ? null : ((Number) row[1]).doubleValue();
            long count = ((Number) row[2]).longValue();
            map.put(pid, new double[]{ avg == null ? Double.NaN : avg, count });
        }
        return map;
    }

    public List<ProductResponse> toResponses(List<Product> products) {
        Map<Long, double[]> stats = fetchStats(products);
        return products.stream().map(p -> toResponse(p, stats.get(p.getId()))).toList();
    }

    public Page<ProductResponse> mapPageWithStats(Page<Product> page) {
        Map<Long, double[]> stats = fetchStats(page.getContent());
        return page.map(p -> toResponse(p, stats.get(p.getId())));
    }

    public ProductResponse toResponse(Product p) {
        // Single-item path: one extra query is fine; reuses the batch helper for symmetry.
        return toResponse(p, fetchStats(List.of(p)).get(p.getId()));
    }

    private ProductResponse toResponse(Product p, double[] stats) {
        List<ProductImage> images   = p.getImages()   != null ? p.getImages()   : List.of();
        List<ProductVariant> variantList = p.getVariants() != null ? p.getVariants() : List.of();

        if (p.getImages() == null) {
            log.warn("[toResponse] product id={} has null images collection", p.getId());
        }
        if (p.getVariants() == null) {
            log.warn("[toResponse] product id={} has null variants collection", p.getId());
        }

        List<String> imageUrls = images.stream()
                .filter(img -> img.getColor() == null)
                .sorted(Comparator.comparingInt((ProductImage img) -> img.getSortOrder() == null ? 0 : img.getSortOrder()))
                .map(ProductImage::getImageUrl)
                .toList();

        // Resolve the main display image: explicit primary > snapshotted Product.imageUrl >
        // first available ProductImage. This keeps admin's ⭐ choice consistent with the
        // image rendered on customer-facing product cards.
        String mainImageUrl = images.stream()
                .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                .sorted(Comparator.comparingInt((ProductImage img) -> img.getSortOrder() == null ? 0 : img.getSortOrder()))
                .map(ProductImage::getImageUrl)
                .findFirst()
                .orElse(p.getImageUrl() != null
                        ? p.getImageUrl()
                        : images.stream()
                                .sorted(Comparator.comparingInt((ProductImage img) -> img.getSortOrder() == null ? 0 : img.getSortOrder()))
                                .map(ProductImage::getImageUrl)
                                .findFirst()
                                .orElse(null));

        // Build color → images map (preserving insertion order)
        Map<String, List<ProductResponse.ColorImageEntry>> colorImages = new LinkedHashMap<>();
        images.stream()
                .filter(img -> img.getColor() != null)
                .sorted(Comparator.comparingInt((ProductImage img) -> img.getSortOrder() == null ? 0 : img.getSortOrder()))
                .forEach(img -> colorImages
                        .computeIfAbsent(img.getColor(), k -> new ArrayList<>())
                        .add(ProductResponse.ColorImageEntry.builder()
                                .url(img.getImageUrl())
                                .isPrimary(img.getIsPrimary())
                                .build()));

        List<ProductVariantResponse> variants = variantList.stream()
                .map(v -> ProductVariantResponse.builder()
                        .id(v.getId())
                        .color(v.getColor())
                        .size(v.getSize())
                        .stockQuantity(v.getStockQuantity() != null ? v.getStockQuantity() : 0)
                        .shoulders(v.getShoulders())
                        .chest(v.getChest())
                        .waist(v.getWaist())
                        .hip(v.getHip())
                        .length(v.getLength())
                        .build())
                .toList();

        Double avgRating = (stats != null && !Double.isNaN(stats[0])) ? stats[0] : null;
        long reviewCount = stats != null ? (long) stats[1] : 0L;

        return ProductResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .price(p.getPrice())
                .discountPrice(p.getDiscountPrice())
                .season(p.getSeason())
                .discountType(p.getDiscountType())
                .discountValue(p.getDiscountValue())
                .stockQuantity(p.getStockQuantity() != null ? p.getStockQuantity() : 0)
                .imageUrl(mainImageUrl)
                .imageUrls(imageUrls)
                .brand(p.getBrand())
                .size(p.getSize())
                .color(p.getColor())
                .material(p.getMaterial())
                .active(p.getActive() != null ? p.getActive() : true)
                .isBestSeller(p.getIsBestSeller() != null ? p.getIsBestSeller() : false)
                .confirmedOrderCount(p.getConfirmedOrderCount() != null ? p.getConfirmedOrderCount() : 0L)
                .isNew(p.getCreatedAt() != null && p.getCreatedAt().isAfter(LocalDateTime.now().minusDays(3)))
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
