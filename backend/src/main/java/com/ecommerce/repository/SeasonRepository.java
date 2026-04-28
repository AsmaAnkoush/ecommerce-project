package com.ecommerce.repository;

import com.ecommerce.entity.Season;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SeasonRepository extends JpaRepository<Season, Long> {

    Optional<Season> findByName(String name);

    boolean existsByName(String name);

    List<Season> findByIsVisibleTrue();
}
