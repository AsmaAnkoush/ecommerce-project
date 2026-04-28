package com.ecommerce.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "seasons")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Season {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, unique = true)
    private String name;

    private String description;

    private String imageUrl;

    /** Optional tag matching a ProductSeason enum value (SUMMER / WINTER / ALL_SEASON)
     *  so clicking a SeasonCircle filters products by that key. */
    private String seasonKey;

    @Column(name = "is_visible", nullable = false)
    @Builder.Default
    private boolean isVisible = true;
}
