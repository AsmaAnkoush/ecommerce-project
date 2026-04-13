package com.ecommerce.repository;

import com.ecommerce.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    Optional<Category> findByName(String name);

    boolean existsByName(String name);

    /** Customer-facing — only categories the admin has marked visible. */
    List<Category> findByIsVisibleTrue();

    /** Returns rows of [categoryId, count] — used to attach productCount to categories
     *  in a single aggregate query rather than N per-category counts. */
    @Query("SELECT c.id, COUNT(p) FROM Category c LEFT JOIN c.products p GROUP BY c.id")
    List<Object[]> countProductsPerCategory();
}
