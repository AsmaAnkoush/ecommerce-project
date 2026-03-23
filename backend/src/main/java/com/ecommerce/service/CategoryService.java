package com.ecommerce.service;

import com.ecommerce.entity.Category;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    public List<Category> findAll() {
        return categoryRepository.findAll();
    }

    public Category findById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));
    }

    @Transactional
    public Category create(String name, String description, MultipartFile image) throws IOException {
        if (categoryRepository.existsByName(name)) {
            throw new BadRequestException("Category with this name already exists");
        }
        String imageUrl = (image != null && !image.isEmpty()) ? saveImage(image) : null;
        Category category = Category.builder()
                .name(name)
                .description(description)
                .imageUrl(imageUrl)
                .build();
        return categoryRepository.save(category);
    }

    @Transactional
    public Category update(Long id, String name, String description, MultipartFile image) throws IOException {
        Category category = findById(id);
        category.setName(name);
        category.setDescription(description);
        if (image != null && !image.isEmpty()) {
            category.setImageUrl(saveImage(image));
        }
        return categoryRepository.save(category);
    }

    @Transactional
    public void delete(Long id) {
        Category category = findById(id);
        categoryRepository.delete(category);
    }

    private String saveImage(MultipartFile image) throws IOException {
        Path dir = Paths.get(uploadDir, "categories");
        Files.createDirectories(dir);
        String filename = UUID.randomUUID() + "_" + StringUtils.cleanPath(image.getOriginalFilename());
        Files.copy(image.getInputStream(), dir.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
        return "/uploads/categories/" + filename;
    }
}
