package com.ecommerce.controller;

import com.ecommerce.dto.response.AdminDashboardResponse;
import com.ecommerce.entity.ProductSeason;
import com.ecommerce.entity.WebsiteSettings;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.service.WebsiteSettingsService;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.OrderResponse;
import com.ecommerce.dto.response.ProductResponse;
import com.ecommerce.dto.response.ReviewResponse;
import com.ecommerce.dto.response.UserResponse;
import com.ecommerce.entity.ItemStatus;
import com.ecommerce.entity.Order;
import com.ecommerce.entity.User;
import com.ecommerce.service.AdminService;
import com.ecommerce.service.OrderService;
import com.ecommerce.service.ProductService;
import com.ecommerce.service.ReviewService;
import com.ecommerce.service.S3Service;
import com.ecommerce.service.UserService;
import com.ecommerce.util.PageRequestValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final OrderService orderService;
    private final ProductService productService;
    private final ReviewService reviewService;
    private final UserService userService;
    private final WebsiteSettingsService settingsService;
    private final S3Service s3Service;

    private static final List<String> ALLOWED_IMAGE_TYPES = List.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );

    // ── Products (admin — includes inactive) ──────────────────────────────────
    @GetMapping("/products")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        PageRequestValidator.validate(page, size);
        Page<ProductResponse> products = productService.findAllAdmin(
                PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return ResponseEntity.ok(ApiResponse.success("All products", products));
    }

    @GetMapping("/offers")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getAllOffers() {
        return ResponseEntity.ok(ApiResponse.success("Admin offers", productService.findAllOffersAdmin()));
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Product found", productService.findByIdAdmin(id)));
    }

    // ── Stock alerts ──────────────────────────────────────────────────────────
    @GetMapping("/stock/out-of-stock")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getOutOfStockProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        PageRequestValidator.validate(page, size);
        return ResponseEntity.ok(ApiResponse.success("Out of stock products",
                productService.findOutOfStockAdmin(
                        PageRequest.of(page, size, Sort.by("createdAt").descending()))));
    }

    @GetMapping("/stock/low-stock")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getLowStockProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size,
            @RequestParam(defaultValue = "5") int threshold) {
        PageRequestValidator.validate(page, size);
        return ResponseEntity.ok(ApiResponse.success("Low stock products",
                productService.findLowStockAdmin(
                        PageRequest.of(page, size, Sort.by("stockQuantity").ascending()), threshold)));
    }

    // ── Dashboard ─────────────────────────────────────────────────────────────
    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<AdminDashboardResponse>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.success("Dashboard data", adminService.getDashboard()));
    }

    // ── Orders ────────────────────────────────────────────────────────────────
    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequestValidator.validate(page, size);
        Page<OrderResponse> orders = orderService.getAllOrders(
                PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return ResponseEntity.ok(ApiResponse.success("All orders", orders));
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrder(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Order found", orderService.getOrderById(id)));
    }

    @PatchMapping("/orders/{id}/status")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam Order.OrderStatus status) {
        return ResponseEntity.ok(ApiResponse.success("Order status updated", orderService.updateStatus(id, status)));
    }

    @PatchMapping("/orders/{orderId}/items/{itemId}/status")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderItemStatus(
            @PathVariable Long orderId,
            @PathVariable Long itemId,
            @RequestParam ItemStatus status) {
        return ResponseEntity.ok(ApiResponse.success("Item status updated",
                orderService.updateItemStatus(orderId, itemId, status)));
    }

    @PatchMapping("/orders/{id}/confirm-all")
    public ResponseEntity<ApiResponse<OrderResponse>> confirmAllItems(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("All items confirmed", orderService.confirmAllItems(id)));
    }

    @PatchMapping("/orders/{id}/cancel-all")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelAllItems(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("All items cancelled", orderService.cancelAllItems(id)));
    }

    @PatchMapping("/orders/{id}/archive")
    public ResponseEntity<ApiResponse<OrderResponse>> archiveOrder(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Order archived", orderService.archive(id)));
    }

    @DeleteMapping("/orders/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteOrder(@PathVariable Long id) {
        orderService.deleteOrder(id);
        return ResponseEntity.ok(ApiResponse.success("Order deleted", null));
    }

    @GetMapping("/orders/archived")
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> getArchivedOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequestValidator.validate(page, size);
        return ResponseEntity.ok(ApiResponse.success("Archived orders",
                orderService.getArchivedOrders(PageRequest.of(page, size, Sort.by("createdAt").descending()))));
    }

    // ── Users ─────────────────────────────────────────────────────────────────
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Page<UserResponse>>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(required = false) String search) {
        PageRequestValidator.validate(page, size);
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<UserResponse> users = (search != null && !search.isBlank())
                ? userService.search(search, pageable)
                : userService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success("Users retrieved", users));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("User found", userService.getUser(id)));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success("User deleted"));
    }

    // ── Logo upload ───────────────────────────────────────────────────────────
    @PostMapping(value = "/settings/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<WebsiteSettings>> uploadLogo(
            @RequestParam("file") MultipartFile file) throws IOException {

        if (file == null || file.isEmpty())
            throw new BadRequestException("No file provided");

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType))
            throw new BadRequestException("Invalid file type. Allowed: JPEG, PNG, WEBP, GIF");

        if (file.getSize() > 5 * 1024 * 1024)
            throw new BadRequestException("Logo file too large. Max size is 5 MB");

        String logoUrl = s3Service.upload(file);
        WebsiteSettings updated = settingsService.updateLogoUrl(logoUrl);
        return ResponseEntity.ok(ApiResponse.success("Logo uploaded", updated));
    }

    // ── Season ────────────────────────────────────────────────────────────────
    @PutMapping("/settings/season")
    public ResponseEntity<ApiResponse<WebsiteSettings>> updateSeason(@RequestParam ProductSeason season) {
        return ResponseEntity.ok(ApiResponse.success("Active season updated", settingsService.updateSeason(season)));
    }

    // ── Reviews ───────────────────────────────────────────────────────────────
    @GetMapping("/reviews")
    public ResponseEntity<ApiResponse<Page<ReviewResponse>>> getAllReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success("Reviews retrieved",
                reviewService.getAllReviews(PageRequest.of(page, size, Sort.by("createdAt").descending()))));
    }

    @PatchMapping("/reviews/{id}/approve")
    public ResponseEntity<ApiResponse<ReviewResponse>> approveReview(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Review approved", reviewService.setApproval(id, true)));
    }

    @PatchMapping("/reviews/{id}/reject")
    public ResponseEntity<ApiResponse<ReviewResponse>> rejectReview(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Review hidden", reviewService.setApproval(id, false)));
    }
}
