package com.ecommerce.repository;

import com.ecommerce.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {

    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM ProductVariant pv WHERE pv.product.id = :productId")
    void deleteByProductId(@Param("productId") Long productId);

    List<ProductVariant> findByProductId(Long productId);
}
