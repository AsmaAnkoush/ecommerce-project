package com.ecommerce.service;

import com.ecommerce.entity.Season;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.SeasonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SeasonService {

    private final SeasonRepository seasonRepository;
    private final S3Service s3Service;

    /** Admin view — every season, including hidden ones. */
    public List<Season> findAll() {
        return seasonRepository.findAll();
    }

    /** Customer view — only visible seasons. */
    public List<Season> findVisible() {
        return seasonRepository.findByIsVisibleTrue();
    }

    @Transactional
    public Season toggleVisibility(Long id) {
        Season season = findById(id);
        season.setVisible(!season.isVisible());
        return seasonRepository.save(season);
    }

    public Season findById(Long id) {
        return seasonRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Season", id));
    }

    @Transactional
    public Season create(String name, String description, String seasonKey, MultipartFile image) throws IOException {
        if (seasonRepository.existsByName(name)) {
            throw new BadRequestException("Season with this name already exists");
        }
        String imageUrl = (image != null && !image.isEmpty()) ? s3Service.upload(image) : null;
        Season season = Season.builder()
                .name(name)
                .description(description)
                .seasonKey(seasonKey)
                .imageUrl(imageUrl)
                .build();
        return seasonRepository.save(season);
    }

    @Transactional
    public Season update(Long id, String name, String description, String seasonKey, MultipartFile image) throws IOException {
        Season season = findById(id);
        season.setName(name);
        season.setDescription(description);
        season.setSeasonKey(seasonKey);
        if (image != null && !image.isEmpty()) {
            season.setImageUrl(s3Service.upload(image));
        }
        return seasonRepository.save(season);
    }

    @Transactional
    public void delete(Long id) {
        Season season = findById(id);
        seasonRepository.delete(season);
    }
}
