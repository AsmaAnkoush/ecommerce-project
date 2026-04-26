package com.ecommerce.controller;

import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.service.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class UploadController {

    private final S3Service s3Service;

    private static final List<String> ALLOWED_TYPES = List.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

    @PostMapping("/images")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<String>>> uploadImages(
            @RequestParam("files") MultipartFile[] files) throws IOException {

        if (files == null || files.length == 0) {
            throw new BadRequestException("No files provided");
        }

        List<String> urls = new ArrayList<>();

        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;

            String contentType = file.getContentType();
            if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
                throw new BadRequestException("Invalid file type: " + contentType + ". Allowed: JPEG, PNG, WEBP, GIF");
            }
            if (file.getSize() > MAX_FILE_SIZE) {
                throw new BadRequestException("File too large: " + file.getOriginalFilename() + ". Max size is 10 MB");
            }

            urls.add(s3Service.upload(file));
        }

        return ResponseEntity.ok(ApiResponse.success("Images uploaded", urls));
    }
}
