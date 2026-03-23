package com.ecommerce.controller;

import com.ecommerce.dto.request.GuestOrderRequest;
import com.ecommerce.dto.request.OrderRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.OrderResponse;
import com.ecommerce.security.UserDetailsImpl;
import com.ecommerce.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    /** Authenticated customers only — JWT required */
    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> placeOrder(
            @AuthenticationPrincipal UserDetailsImpl user,
            @Valid @RequestBody OrderRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Order placed successfully", orderService.placeOrder(user.getId(), request)));
    }

    /** Public — no auth required */
    @PostMapping("/guest")
    public ResponseEntity<ApiResponse<OrderResponse>> placeGuestOrder(@Valid @RequestBody GuestOrderRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Order placed successfully", orderService.placeGuestOrder(request)));
    }

    /** Authenticated customers — returns only their own orders */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getMyOrders(@AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(ApiResponse.success("Orders retrieved", orderService.getUserOrders(user.getId())));
    }

    /** Authenticated customers — enforces ownership check in service */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrder(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Order found", orderService.getOrder(id, user.getId())));
    }

    // Status update is admin-only and lives in AdminController at /api/admin/orders/{id}/status
}
