package com.ecommerce.service;

import com.ecommerce.entity.Category;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final S3Service s3Service;

    /** Admin view — every category, including hidden ones. */
    public List<Category> findAll() {
        return attachCounts(categoryRepository.findAll());
    }

    /** Customer view — only visible categories. */
    public List<Category> findVisible() {
        return attachCounts(categoryRepository.findByIsVisibleTrue());
    }

    private List<Category> attachCounts(List<Category> categories) {
        Map<Long, Long> counts = new HashMap<>();
        for (Object[] row : categoryRepository.countProductsPerCategory()) {
            counts.put((Long) row[0], (Long) row[1]);
        }
        categories.forEach(c -> c.setProductCount(counts.getOrDefault(c.getId(), 0L)));
        return categories;
    }

    @Transactional
    public Category toggleVisibility(Long id) {
        Category category = findById(id);
        category.setVisible(!category.isVisible());
        return categoryRepository.save(category);
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
        return s3Service.upload(image);
    }
}
