package com.ecommerce.controller;

import com.ecommerce.dto.request.ProductRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.ProductResponse;
import com.ecommerce.entity.Season;
import com.ecommerce.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String color,
            @RequestParam(required = false) String size_filter) {

        // Use filter query when any filter is present
        if (categoryId != null || minPrice != null || maxPrice != null || color != null || size_filter != null) {
            Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
            Pageable pageable = PageRequest.of(page, size, sort);
            return ResponseEntity.ok(ApiResponse.success("Products retrieved",
                    productService.findWithFilters(categoryId, minPrice, maxPrice, color, size_filter, pageable)));
        }

        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(ApiResponse.success("Products retrieved", productService.findAll(pageable)));
    }

    @GetMapping("/latest")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getLatest() {
        return ResponseEntity.ok(ApiResponse.success("Latest products", productService.findLatest()));
    }

    @GetMapping("/best-sellers")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getBestSellers() {
        return ResponseEntity.ok(ApiResponse.success("Best sellers", productService.findBestSellers()));
    }

    @GetMapping("/new-arrivals")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getNewArrivals() {
        return ResponseEntity.ok(ApiResponse.success("New arrivals", productService.findNew()));
    }

    @GetMapping("/on-sale")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getOnSale() {
        return ResponseEntity.ok(ApiResponse.success("On sale products", productService.findOnSale()));
    }

    @GetMapping("/season/{season}")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getBySeason(@PathVariable Season season) {
        return ResponseEntity.ok(ApiResponse.success(season + " products", productService.findBySeason(season)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> search(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success("Search results", productService.search(keyword, pageable)));
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getByCategory(
            @PathVariable Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success("Products by category", productService.findByCategory(categoryId, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Product found", productService.findById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProductResponse>> create(@Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Product created", productService.create(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProductResponse>> update(
            @PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Product updated", productService.update(id, request)));
    }

    @PatchMapping("/{id}/visibility")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProductResponse>> toggleVisibility(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Visibility updated", productService.toggleVisibility(id)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        productService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Product deleted"));
    }
}
