package com.ecommerce.repository;

import com.ecommerce.entity.ShippingZone;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShippingZoneRepository extends JpaRepository<ShippingZone, Long> {
    List<ShippingZone> findAllByOrderByDisplayOrderAsc();
    List<ShippingZone> findAllByActiveIsTrueOrderByDisplayOrderAsc();
}
