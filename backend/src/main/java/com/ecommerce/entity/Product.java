package com.ecommerce.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Optimistic lock. Declared as primitive {@code long} (not {@code Long})
     * so legacy rows with a NULL value in the `version` column come back
     * from JDBC as 0L instead of triggering
     * {@code Hibernate LongVersionType.next(Long current, ...)} to NPE on
     * "Cannot invoke Long.longValue() because current is null". JPA explicitly
     * permits primitive long for @Version.
     */
    @Version
    @Column(name = "version", nullable = false)
    private long version;

    @NotBlank
    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Positive
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(precision = 10, scale = 2)
    private BigDecimal discountPrice;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private ProductSeason season;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private DiscountType discountType;

    @Column(precision = 10, scale = 2)
    private BigDecimal discountValue;

    @PositiveOrZero
    @Column(nullable = false)
    @Builder.Default
    private Integer stockQuantity = 0;

    private String imageUrl;

    private String brand;

    private String size;

    private String color;

    private String material;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    /** Soft-delete flag. Hard-deleting a product would orphan historical
     *  order_items and lose accounting/refund data, so admin "delete" sets
     *  this true; queries everywhere filter `is_deleted = false`. */
    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isBestSeller = false;

    @Column(nullable = false)
    @Builder.Default
    private Long confirmedOrderCount = 0L;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isNew = true;

    @Column(nullable = false)
    @Builder.Default
    private Long viewCount = 0L;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    @Builder.Default
    private List<ProductImage> images = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProductVariant> variants = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Review> reviews = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt;

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        coalesceNullCounters();
    }

    /**
     * Defensive null-coalesce for nullable Long/Integer/Boolean counters.
     *
     * Why: legacy rows that existed before {@code @Version}, {@code viewCount},
     * {@code isDeleted}, etc. were added live in the DB with NULL in those
     * columns. The first update would otherwise blow up with
     * "Cannot invoke Long.longValue() because current is null" when Hibernate
     * tries to bump the version (or when service code does `viewCount + 1`).
     *
     * Runs on both load and persist so a freshly-loaded entity is safe to
     * mutate, and so a save without prior load (rare) still gets defaults.
     */
    @PostLoad
    @PrePersist
    public void coalesceNullCounters() {
        // version is now primitive long — no null check needed.
        if (this.viewCount == null)            this.viewCount = 0L;
        if (this.confirmedOrderCount == null)  this.confirmedOrderCount = 0L;
        if (this.stockQuantity == null)        this.stockQuantity = 0;
        if (this.active == null)               this.active = true;
        if (this.isBestSeller == null)         this.isBestSeller = false;
        if (this.isNew == null)                this.isNew = false;
        if (this.isDeleted == null)            this.isDeleted = false;
    }
}
