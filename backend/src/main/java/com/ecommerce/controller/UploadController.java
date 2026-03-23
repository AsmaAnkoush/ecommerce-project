package com.ecommerce.controller;

import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class UploadController {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private static final List<String> ALLOWED_TYPES = List.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

    @PostMapping("/images")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<String>>> uploadImages(
            @RequestParam("files") MultipartFile[] files) throws IOException {

        if (files == null || files.length == 0) {
            throw new BadRequestException("No files provided");
        }

        Path uploadPath = Paths.get(uploadDir).toAbsolutePath();
        Files.createDirectories(uploadPath);

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

            String ext = getExtension(file.getOriginalFilename(), contentType);
            String filename = UUID.randomUUID() + "." + ext;
            Files.copy(file.getInputStream(), uploadPath.resolve(filename));

            urls.add("/uploads/" + filename);
        }

        return ResponseEntity.ok(ApiResponse.success("Images uploaded", urls));
    }

    private String getExtension(String originalFilename, String contentType) {
        if (originalFilename != null && originalFilename.contains(".")) {
            return originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase();
        }
        return switch (contentType) {
            case "image/png"  -> "png";
            case "image/webp" -> "webp";
            case "image/gif"  -> "gif";
            default           -> "jpg";
        };
    }
}
