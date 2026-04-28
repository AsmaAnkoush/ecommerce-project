package com.ecommerce.entity;

import jakarta.persistence.*;
import lombok.*;

import static com.ecommerce.entity.ProductSeason.SUMMER;

@Entity
@Table(name = "website_settings")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class WebsiteSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String siteName;

    private String logoUrl;

    private String contactEmail;

    private String contactPhone;

    private String contactWhatsApp;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String address;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    @Builder.Default
    private ProductSeason activeSeason = SUMMER;
}
