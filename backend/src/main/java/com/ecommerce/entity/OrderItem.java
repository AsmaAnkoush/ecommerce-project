package com.ecommerce.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    /** Stored at order time — not derived from product entity */
    @Column(length = 30)
    private String size;

    @Column(length = 50)
    private String color;

    /** Product name snapshot — remains accurate even if product is renamed/deleted */
    @Column(length = 255)
    private String productName;

    @Column(length = 512)
    private String productImage;

    /** Per-item fulfillment status. Only PENDING items can be confirmed or cancelled.
     *  Confirming an item deducts stock; this prevents double-deduction if the
     *  order-level status is also confirmed later. */
    @Enumerated(EnumType.STRING)
    @Column(name = "item_status", length = 20, nullable = false)
    @Builder.Default
    private ItemStatus itemStatus = ItemStatus.PENDING;

    /** Null-coalesce for rows created before item_status column was added. */
    @PostLoad
    @PrePersist
    public void coalesceDefaults() {
        if (this.itemStatus == null) this.itemStatus = ItemStatus.PENDING;
    }
}
