package com.ecommerce.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "product_variants")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false, length = 100)
    private String color; // free-form color name e.g. "Navy Blue", "Coral"

    @Column(nullable = false, length = 10)
    private String size; // e.g. "38", "S", "M"

    @Column(nullable = false)
    @Builder.Default
    private Integer stockQuantity = 0;

    // ── Measurements (all optional, in cm) ──────────────────────────────────
    @Column(precision = 6, scale = 1)
    private BigDecimal chest;

    @Column(precision = 6, scale = 1)
    private BigDecimal waist;

    @Column(precision = 6, scale = 1)
    private BigDecimal shoulders;

    @Column(name = "back_width", precision = 6, scale = 1)
    private BigDecimal backWidth;

    @Column(precision = 6, scale = 1)
    private BigDecimal hip;

    @Column(precision = 6, scale = 1)
    private BigDecimal length;
}
