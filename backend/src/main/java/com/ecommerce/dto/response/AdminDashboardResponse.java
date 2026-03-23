package com.ecommerce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardResponse {

    private long totalProducts;
    private long totalOrders;
    private long ordersToday;
    private long totalUsers;
    private long pendingOrders;
    private long lowStockCount;
    private BigDecimal totalRevenue;
    private List<BestSellerItem> bestSellers;
}
