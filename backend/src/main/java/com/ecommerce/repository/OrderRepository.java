package com.ecommerce.repository;

import com.ecommerce.dto.response.BestSellerItem;
import com.ecommerce.entity.Order;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

    long countByStatus(Order.OrderStatus status);

    /** Active (non-archived) orders. Used by both the customer and the admin lists by default. */
    org.springframework.data.domain.Page<Order> findByIsArchivedFalse(org.springframework.data.domain.Pageable pageable);

    /** Archived orders only. */
    org.springframework.data.domain.Page<Order> findByIsArchivedTrue(org.springframework.data.domain.Pageable pageable);

    List<Order> findByUserIdAndIsArchivedFalseOrderByCreatedAtDesc(Long userId);

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status = :status")
    BigDecimal sumRevenueByStatus(@Param("status") Order.OrderStatus status);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o " +
           "WHERE o.status = :status AND o.createdAt >= :start AND o.createdAt < :end")
    BigDecimal sumRevenueByStatusBetween(@Param("status") Order.OrderStatus status,
                                         @Param("start") LocalDateTime start,
                                         @Param("end") LocalDateTime end);

    @Query("SELECT new com.ecommerce.dto.response.BestSellerItem(" +
           "oi.product.id, oi.productName, oi.productImage, SUM(oi.quantity)) " +
           "FROM OrderItem oi " +
           "WHERE oi.order.status = :status " +
           "GROUP BY oi.product.id, oi.productName, oi.productImage " +
           "ORDER BY SUM(oi.quantity) DESC")
    List<BestSellerItem> findTopSellingProductsByStatus(@Param("status") Order.OrderStatus status, Pageable pageable);

    @Query("SELECT COUNT(oi) FROM OrderItem oi WHERE oi.product.id = :productId")
    long countOrderItemsByProductId(@Param("productId") Long productId);

    @Modifying
    @Query("DELETE FROM OrderItem oi WHERE oi.product.id = :productId")
    void deleteOrderItemsByProductId(@Param("productId") Long productId);
}
