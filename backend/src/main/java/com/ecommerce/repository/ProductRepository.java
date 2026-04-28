package com.ecommerce.repository;

import com.ecommerce.entity.Product;
import com.ecommerce.entity.ProductSeason;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Note on soft-delete: every public-facing query filters
 * `is_deleted = false` (either via derived-method naming or in the
 * WHERE clause of @Query). Admin "find all" lists also exclude deleted
 * rows so admins can't accidentally re-edit a tombstoned product.
 */
@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Page<Product> findByActiveTrueAndIsDeletedFalse(Pageable pageable);

    Page<Product> findByCategoryIdAndActiveTrueAndIsDeletedFalse(Long categoryId, Pageable pageable);

    List<Product> findTop8ByActiveTrueAndIsDeletedFalseOrderByCreatedAtDesc();

    List<Product> findByActiveTrueAndIsNewTrueAndIsDeletedFalseOrderByCreatedAtDesc();

    /** Dynamic "new arrivals" — products created after a cutoff and whose season
     *  is in the supplied list (typically [currentSeason, ALL_SEASON]). */
    List<Product> findByActiveTrueAndIsDeletedFalseAndSeasonInAndCreatedAtAfterOrderByCreatedAtDesc(
            List<ProductSeason> seasons, LocalDateTime cutoff);

    List<Product> findByActiveTrueAndIsBestSellerTrueAndIsDeletedFalseOrderByConfirmedOrderCountDesc();

    List<Product> findByActiveTrueAndDiscountPriceIsNotNullAndIsDeletedFalse();

    /** Active, non-deleted products that have any kind of discount. */
    @Query("SELECT p FROM Product p WHERE p.active = true AND p.isDeleted = false AND " +
           "(p.discountPrice IS NOT NULL " +
           " OR (p.discountValue IS NOT NULL AND p.discountValue > 0))")
    List<Product> findActiveOffers();

    /** Admin variant — ignores the active flag (hidden products still appear) but
     *  still excludes soft-deleted rows. */
    @Query("SELECT p FROM Product p WHERE p.isDeleted = false AND (" +
           "p.discountPrice IS NOT NULL " +
           "OR (p.discountValue IS NOT NULL AND p.discountValue > 0))")
    List<Product> findAllWithDiscount();

    @Query("SELECT p FROM Product p WHERE p.active = true AND p.isDeleted = false AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.brand) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.category.name) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Product> searchProducts(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.active = true AND p.isDeleted = false " +
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

    List<Product> findByActiveTrueAndSeasonAndIsDeletedFalseOrderByCreatedAtDesc(ProductSeason season);

    List<Product> findByActiveTrueAndSeasonInAndIsDeletedFalseOrderByCreatedAtDesc(List<ProductSeason> seasons);

    long countByActiveTrueAndIsDeletedFalse();

    long countByActiveTrueAndIsDeletedFalseAndStockQuantityGreaterThanAndStockQuantityLessThan(int gt, int lt);

    /** Admin "find all" — excludes tombstoned rows. */
    Page<Product> findByIsDeletedFalse(Pageable pageable);

    /**
     * Row-level write lock on the product row — fallback when an order item
     * has no colour+size variant. Blocks concurrent stock deductions on the
     * same product until the transaction commits.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);
}
