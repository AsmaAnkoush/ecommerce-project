package com.ecommerce.controller;

import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.entity.Season;
import com.ecommerce.service.SeasonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/seasons")
@RequiredArgsConstructor
public class SeasonController {

    private final SeasonService seasonService;

    /** Customer-facing — only visible seasons. */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Season>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success("Seasons retrieved", seasonService.findVisible()));
    }

    /** Admin view — every season, including hidden ones. */
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Season>>> getAllForAdmin() {
        return ResponseEntity.ok(ApiResponse.success("All seasons", seasonService.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Season>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Season found", seasonService.findById(id)));
    }

    @PatchMapping("/{id}/toggle-visibility")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Season>> toggleVisibility(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Visibility toggled", seasonService.toggleVisibility(id)));
    }

    @PostMapping(consumes = "multipart/form-data")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Season>> create(
            @RequestParam String name,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String seasonKey,
            @RequestParam(required = false) MultipartFile image) throws IOException {
        return ResponseEntity.ok(ApiResponse.success("Season created",
                seasonService.create(name, description, seasonKey, image)));
    }

    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Season>> update(
            @PathVariable Long id,
            @RequestParam String name,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String seasonKey,
            @RequestParam(required = false) MultipartFile image) throws IOException {
        return ResponseEntity.ok(ApiResponse.success("Season updated",
                seasonService.update(id, name, description, seasonKey, image)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        seasonService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Season deleted"));
    }
}
