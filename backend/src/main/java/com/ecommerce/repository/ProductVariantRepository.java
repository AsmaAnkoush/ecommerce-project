package com.ecommerce.repository;

import com.ecommerce.entity.ProductVariant;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM ProductVariant pv WHERE pv.product.id = :productId")
    void deleteByProductId(@Param("productId") Long productId);

    List<ProductVariant> findByProductId(Long productId);

    Optional<ProductVariant> findByProductIdAndColorIgnoreCaseAndSizeIgnoreCase(
            Long productId, String color, String size);

    /**
     * Issues SELECT ... FOR UPDATE on the matching variant row.
     * Any concurrent transaction trying to lock the same row will block
     * until this transaction commits or rolls back — preventing two
     * simultaneous confirmations from both seeing the same non-zero stock
     * and both deducting it (the race condition).
     *
     * Must be called inside an active @Transactional method; the lock is
     * held until the transaction ends.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT v FROM ProductVariant v " +
           "WHERE v.product.id = :productId " +
           "AND LOWER(v.color) = LOWER(:color) " +
           "AND LOWER(v.size)  = LOWER(:size)")
    Optional<ProductVariant> findForUpdate(
            @Param("productId") Long productId,
            @Param("color")     String color,
            @Param("size")      String size);
}
