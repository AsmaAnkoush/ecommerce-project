package com.ecommerce.repository;

import com.ecommerce.entity.WebsiteSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WebsiteSettingsRepository extends JpaRepository<WebsiteSettings, Long> {
}
