package com.ecommerce.controller;

import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.entity.WebsiteSettings;
import com.ecommerce.service.WebsiteSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class WebsiteSettingsController {

    private final WebsiteSettingsService settingsService;

    @GetMapping
    public ResponseEntity<ApiResponse<WebsiteSettings>> getSettings() {
        return ResponseEntity.ok(ApiResponse.success("Settings retrieved", settingsService.getSettings()));
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<WebsiteSettings>> updateSettings(@RequestBody WebsiteSettings settings) {
        return ResponseEntity.ok(ApiResponse.success("Settings updated", settingsService.updateSettings(settings)));
    }
}
