package com.ecommerce.controller;

import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.ShippingZoneResponse;
import com.ecommerce.repository.ShippingZoneRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shipping-zones")
@RequiredArgsConstructor
public class ShippingZoneController {

    private final ShippingZoneRepository shippingZoneRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ShippingZoneResponse>>> getAll() {
        List<ShippingZoneResponse> zones = shippingZoneRepository.findAllByActiveIsTrueOrderByDisplayOrderAsc()
                .stream()
                .map(z -> ShippingZoneResponse.builder()
                        .id(z.getId())
                        .nameEn(z.getNameEn())
                        .nameAr(z.getNameAr())
                        .price(z.getPrice())
                        .deliveryDays(z.getDeliveryDays())
                        .icon(z.getIcon())
                        .active(z.isActive())
                        .build())
                .toList();
        return ResponseEntity.ok(ApiResponse.success("Shipping zones retrieved", zones));
    }
}
