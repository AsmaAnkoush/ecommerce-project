package com.ecommerce.service;

import com.ecommerce.dto.response.AdminDashboardResponse;
import com.ecommerce.dto.response.BestSellerItem;
import com.ecommerce.entity.Order;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    public AdminDashboardResponse getDashboard() {
        long totalProducts  = productRepository.countByActiveTrue();
        long lowStockCount  = productRepository.countByActiveTrueAndStockQuantityGreaterThanAndStockQuantityLessThan(0, 5);
        long totalOrders    = orderRepository.count();
        long totalUsers     = userRepository.count();
        long pendingOrders  = orderRepository.countByStatus(Order.OrderStatus.PENDING);

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay   = startOfDay.plusDays(1);
        long ordersToday = orderRepository.countByCreatedAtBetween(startOfDay, endOfDay);

        BigDecimal totalRevenue = orderRepository.sumRevenueExcludingStatus(Order.OrderStatus.CANCELLED);

        List<BestSellerItem> bestSellers = orderRepository.findTopSellingProducts(Order.OrderStatus.CANCELLED, PageRequest.of(0, 5));

        return AdminDashboardResponse.builder()
                .totalProducts(totalProducts)
                .lowStockCount(lowStockCount)
                .totalOrders(totalOrders)
                .ordersToday(ordersToday)
                .totalUsers(totalUsers)
                .pendingOrders(pendingOrders)
                .totalRevenue(totalRevenue)
                .bestSellers(bestSellers)
                .build();
    }
}
