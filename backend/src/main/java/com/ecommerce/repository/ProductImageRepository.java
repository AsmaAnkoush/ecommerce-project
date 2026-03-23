package com.ecommerce.repository;

import com.ecommerce.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {

    List<ProductImage> findByProductIdOrderBySortOrderAsc(Long productId);

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM ProductImage pi WHERE pi.product.id = :productId")
    void deleteByProductId(@Param("productId") Long productId);

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM ProductImage pi WHERE pi.product.id = :productId AND pi.color IS NULL")
    void deleteByProductIdAndColorIsNull(@Param("productId") Long productId);

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM ProductImage pi WHERE pi.product.id = :productId AND pi.color IS NOT NULL")
    void deleteByProductIdAndColorIsNotNull(@Param("productId") Long productId);
}
