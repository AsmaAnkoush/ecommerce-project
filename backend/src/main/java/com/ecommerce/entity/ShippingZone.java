package com.ecommerce.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Entity
@Table(name = "shipping_zones")
public class ShippingZone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nameEn;

    @Column(nullable = false)
    private String nameAr;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    private String deliveryDays;

    private String icon;

    @Column(name = "display_order")
    private Integer displayOrder = 0;

    @Column(nullable = false)
    private boolean active = true;
}
