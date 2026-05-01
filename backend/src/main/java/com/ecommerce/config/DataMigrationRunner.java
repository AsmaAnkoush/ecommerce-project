package com.ecommerce.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * One-shot, idempotent backfill for nullable counter / flag columns that
 * were added by later migrations. Without this, legacy rows have NULL in
 * columns Hibernate (or service code) treats as primitives — most notably
 * {@code products.version} — and the next admin edit blows up with
 * "Cannot invoke Long.longValue() because current is null".
 *
 * Each statement is a no-op once the column is fully backfilled, so it's
 * safe to keep around across releases.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataMigrationRunner implements CommandLineRunner {

    private final JdbcTemplate jdbc;

    @Override
    @Transactional
    public void run(String... args) {
        backfill("products", "version",                "0",     "BIGINT");
        backfill("products", "view_count",             "0",     "BIGINT");
        backfill("products", "confirmed_order_count",  "0",     "BIGINT");
        backfill("products", "is_deleted",             "false", "BOOLEAN");
        backfill("products", "is_best_seller",         "false", "BOOLEAN");
        backfill("products", "is_new",                 "false", "BOOLEAN");
        backfill("products", "active",                 "true",  "BOOLEAN");
        backfill("products", "stock_quantity",         "0",     "INT");

        backfill("orders",   "version",                "0",     "BIGINT");
        backfill("orders",   "is_archived",            "false", "BOOLEAN");

        backfill("product_images", "sort_order",       "0",     "INT");
        backfill("product_images", "is_primary",       "false", "BOOLEAN");

        seedShippingZones();
    }

    private void seedShippingZones() {
        try {
            Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM shipping_zones", Integer.class);
            if (count == null || count == 0) {
                jdbc.update("INSERT INTO shipping_zones (name_en, name_ar, price, delivery_days, icon, display_order) VALUES (?, ?, ?, ?, ?, ?)",
                        "West Bank", "الضفة الغربية", "20.00", "1-2", "📦", 1);
                jdbc.update("INSERT INTO shipping_zones (name_en, name_ar, price, delivery_days, icon, display_order) VALUES (?, ?, ?, ?, ?, ?)",
                        "Jerusalem", "القدس", "30.00", "1-2", "🏛️", 2);
                jdbc.update("INSERT INTO shipping_zones (name_en, name_ar, price, delivery_days, icon, display_order) VALUES (?, ?, ?, ?, ?, ?)",
                        "Inside 48", "داخل الـ 48", "70.00", "1-2", "🚚", 3);
                log.info("Seeded 3 shipping zones");
            } else {
                // Normalize any rows that still carry the old value
                int updated = jdbc.update("UPDATE shipping_zones SET delivery_days = '1-2' WHERE delivery_days != '1-2'");
                if (updated > 0) log.info("Normalized {} shipping zone(s) delivery_days → 1-2", updated);
            }
        } catch (Exception ex) {
            log.debug("Could not seed/normalize shipping_zones: {}", ex.getMessage());
        }
    }

    /**
     * Runs {@code UPDATE table SET col = default WHERE col IS NULL} only
     * if the column actually exists. Swallows errors per-statement so a
     * missing column on a fresh DB doesn't abort the whole boot.
     */
    private void backfill(String table, String column, String defaultLiteral, String type) {
        try {
            int updated = jdbc.update(
                "UPDATE " + table + " SET " + column + " = " + defaultLiteral
                + " WHERE " + column + " IS NULL");
            if (updated > 0) {
                log.info("Backfilled {} NULL values in {}.{} → {}", updated, table, column, defaultLiteral);
            }
        } catch (Exception ex) {
            // Column may not exist yet on a fresh DB — Hibernate ddl-auto will
            // create it on first entity touch; the next boot will backfill cleanly.
            log.debug("Skipped backfill for {}.{} ({}): {}", table, column, type, ex.getMessage());
        }
    }
}
