package com.ecommerce.repository;

import com.ecommerce.dto.response.BestSellerItem;
import com.ecommerce.entity.Order;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
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

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status <> :status")
    BigDecimal sumRevenueExcludingStatus(@Param("status") Order.OrderStatus status);

    @Query("SELECT new com.ecommerce.dto.response.BestSellerItem(" +
           "oi.product.id, oi.productName, oi.productImage, SUM(oi.quantity)) " +
           "FROM OrderItem oi " +
           "WHERE oi.order.status <> :excluded " +
           "GROUP BY oi.product.id, oi.productName, oi.productImage " +
           "ORDER BY SUM(oi.quantity) DESC")
    List<BestSellerItem> findTopSellingProducts(@Param("excluded") Order.OrderStatus excluded, Pageable pageable);
}
