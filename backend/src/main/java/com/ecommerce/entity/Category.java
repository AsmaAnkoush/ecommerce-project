package com.ecommerce.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "categories")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, unique = true)
    private String name;

    private String description;

    private String imageUrl;

    @Column(name = "is_visible", nullable = false)
    @Builder.Default
    private boolean isVisible = true;

    @JsonIgnore
    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Product> products = new ArrayList<>();

    /** Populated on demand by {@link com.ecommerce.service.CategoryService#findAll()} —
     *  not persisted. Exposed to the API so admin UIs can show product counts without
     *  forcing every caller to fetch the (JSON-ignored) products collection. */
    @Transient
    @Builder.Default
    private Long productCount = 0L;
}
