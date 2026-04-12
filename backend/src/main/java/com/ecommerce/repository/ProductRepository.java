package com.ecommerce.repository;

import com.ecommerce.entity.Product;
import com.ecommerce.entity.Season;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Page<Product> findByActiveTrue(Pageable pageable);

    Page<Product> findByCategoryIdAndActiveTrue(Long categoryId, Pageable pageable);

    List<Product> findTop8ByActiveTrueOrderByCreatedAtDesc();

    List<Product> findByActiveTrueAndIsNewTrueOrderByCreatedAtDesc();

    List<Product> findByActiveTrueAndIsBestSellerTrueOrderByConfirmedOrderCountDesc();

    List<Product> findByActiveTrueAndDiscountPriceIsNotNull();

    /** Active products that have any kind of discount applied —
     *  either a stored discountPrice or a positive discountValue. */
    @Query("SELECT p FROM Product p WHERE p.active = true AND " +
           "(p.discountPrice IS NOT NULL " +
           " OR (p.discountValue IS NOT NULL AND p.discountValue > 0))")
    List<Product> findActiveOffers();

    @Query("SELECT p FROM Product p WHERE p.active = true AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.brand) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.category.name) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Product> searchProducts(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.active = true " +
           "AND (:categoryId IS NULL OR p.category.id = :categoryId) " +
           "AND (:minPrice IS NULL OR p.price >= :minPrice) " +
           "AND (:maxPrice IS NULL OR p.price <= :maxPrice) " +
           "AND (:color IS NULL OR LOWER(p.color) LIKE LOWER(CONCAT('%', :color, '%'))) " +
           "AND (:size IS NULL OR LOWER(p.size) LIKE LOWER(CONCAT('%', :size, '%')))")
    Page<Product> findWithFilters(@Param("categoryId") Long categoryId,
                                  @Param("minPrice") BigDecimal minPrice,
                                  @Param("maxPrice") BigDecimal maxPrice,
                                  @Param("color") String color,
                                  @Param("size") String size,
                                  Pageable pageable);

    List<Product> findByActiveTrueAndSeasonOrderByCreatedAtDesc(Season season);

    List<Product> findByActiveTrueAndSeasonInOrderByCreatedAtDesc(List<Season> seasons);

    long countByActiveTrue();

    long countByActiveTrueAndStockQuantityGreaterThanAndStockQuantityLessThan(int gt, int lt);
}
