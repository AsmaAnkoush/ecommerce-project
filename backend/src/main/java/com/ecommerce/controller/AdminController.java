package com.ecommerce.controller;

import com.ecommerce.dto.response.AdminDashboardResponse;
import com.ecommerce.entity.Season;
import com.ecommerce.entity.WebsiteSettings;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.service.WebsiteSettingsService;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.OrderResponse;
import com.ecommerce.dto.response.ProductResponse;
import com.ecommerce.dto.response.ReviewResponse;
import com.ecommerce.dto.response.UserResponse;
import com.ecommerce.entity.Order;
import com.ecommerce.entity.User;
import com.ecommerce.service.AdminService;
import com.ecommerce.service.OrderService;
import com.ecommerce.service.ProductService;
import com.ecommerce.service.ReviewService;
import com.ecommerce.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
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
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

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

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private static final List<String> ALLOWED_IMAGE_TYPES = List.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );

    // ── Products (admin — includes inactive) ──────────────────────────────────
    @GetMapping("/products")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        Page<ProductResponse> products = productService.findAllAdmin(
                PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return ResponseEntity.ok(ApiResponse.success("All products", products));
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Product found", productService.findByIdAdmin(id)));
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

    // ── Users ─────────────────────────────────────────────────────────────────
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Page<UserResponse>>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(required = false) String search) {
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

        Path uploadPath = Paths.get(uploadDir).toAbsolutePath();
        Files.createDirectories(uploadPath);

        String ext = (file.getOriginalFilename() != null && file.getOriginalFilename().contains("."))
                ? file.getOriginalFilename().substring(file.getOriginalFilename().lastIndexOf('.') + 1).toLowerCase()
                : switch (contentType) {
                    case "image/png"  -> "png";
                    case "image/webp" -> "webp";
                    default           -> "jpg";
                };

        String filename = "logo-" + UUID.randomUUID() + "." + ext;
        Files.copy(file.getInputStream(), uploadPath.resolve(filename));

        String logoUrl = "/uploads/" + filename;
        WebsiteSettings updated = settingsService.updateLogoUrl(logoUrl);
        return ResponseEntity.ok(ApiResponse.success("Logo uploaded", updated));
    }

    // ── Season ────────────────────────────────────────────────────────────────
    @PutMapping("/settings/season")
    public ResponseEntity<ApiResponse<WebsiteSettings>> updateSeason(@RequestParam Season season) {
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
