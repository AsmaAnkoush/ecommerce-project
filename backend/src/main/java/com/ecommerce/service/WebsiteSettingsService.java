package com.ecommerce.service;

import com.ecommerce.entity.Season;
import com.ecommerce.entity.WebsiteSettings;
import com.ecommerce.repository.WebsiteSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class WebsiteSettingsService {

    private final WebsiteSettingsRepository repository;

    public WebsiteSettings getSettings() {
        return repository.findAll().stream().findFirst()
                .orElseGet(() -> repository.save(
                        WebsiteSettings.builder()
                                .siteName("DripStore")
                                .contactWhatsApp("+1234567890")
                                .build()
                ));
    }

    @Transactional
    public WebsiteSettings updateSettings(WebsiteSettings updated) {
        WebsiteSettings settings = getSettings();
        settings.setSiteName(updated.getSiteName());
        settings.setLogoUrl(updated.getLogoUrl());
        settings.setContactEmail(updated.getContactEmail());
        settings.setContactPhone(updated.getContactPhone());
        settings.setContactWhatsApp(updated.getContactWhatsApp());
        settings.setDescription(updated.getDescription());
        settings.setAddress(updated.getAddress());
        if (updated.getActiveSeason() != null) {
            settings.setActiveSeason(updated.getActiveSeason());
        }
        return repository.save(settings);
    }

    @Transactional
    public WebsiteSettings updateLogoUrl(String logoUrl) {
        WebsiteSettings settings = getSettings();
        settings.setLogoUrl(logoUrl);
        return repository.save(settings);
    }

    @Transactional
    public WebsiteSettings updateSeason(Season season) {
        WebsiteSettings settings = getSettings();
        settings.setActiveSeason(season);
        return repository.save(settings);
    }
}
