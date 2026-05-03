package com.ecommerce.controller;

import com.ecommerce.dto.request.ShippingZoneRequest;
import com.ecommerce.dto.response.ApiResponse;
import com.ecommerce.dto.response.ShippingZoneResponse;
import com.ecommerce.entity.ShippingZone;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.ShippingZoneRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/shipping-zones")
@RequiredArgsConstructor
public class AdminShippingZoneController {

    private final ShippingZoneRepository shippingZoneRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ShippingZoneResponse>>> getAll() {
        List<ShippingZoneResponse> zones = shippingZoneRepository.findAllByOrderByDisplayOrderAsc()
                .stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success("Shipping zones retrieved", zones));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ShippingZoneResponse>> create(@RequestBody ShippingZoneRequest req) {
        ShippingZone zone = new ShippingZone();
        zone.setNameEn(req.getNameEn());
        zone.setNameAr(req.getNameAr());
        zone.setPrice(req.getPrice());
        zone.setDeliveryDays(req.getDeliveryDays());
        zone.setIcon(req.getIcon() != null ? req.getIcon() : "📦");
        zone.setDisplayOrder(req.getDisplayOrder() != null ? req.getDisplayOrder() : 99);
        zone.setActive(true);
        ShippingZone saved = shippingZoneRepository.save(zone);
        return ResponseEntity.ok(ApiResponse.success("Shipping zone created", toResponse(saved)));
    }

    @PatchMapping("/{id}/price")
    public ResponseEntity<ApiResponse<ShippingZoneResponse>> updatePrice(
            @PathVariable Long id, @RequestBody Map<String, Object> body) {
        ShippingZone zone = shippingZoneRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ShippingZone", id));
        Object priceVal = body.get("price");
        if (priceVal != null) {
            zone.setPrice(new BigDecimal(priceVal.toString()));
        }
        return ResponseEntity.ok(ApiResponse.success("Price updated", toResponse(shippingZoneRepository.save(zone))));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<ShippingZoneResponse>> toggleActive(@PathVariable Long id) {
        ShippingZone zone = shippingZoneRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ShippingZone", id));
        zone.setActive(!zone.isActive());
        return ResponseEntity.ok(ApiResponse.success("Active toggled", toResponse(shippingZoneRepository.save(zone))));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        ShippingZone zone = shippingZoneRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ShippingZone", id));
        shippingZoneRepository.delete(zone);
        return ResponseEntity.ok(ApiResponse.success("Shipping zone deleted", null));
    }

    private ShippingZoneResponse toResponse(ShippingZone z) {
        return ShippingZoneResponse.builder()
                .id(z.getId())
                .nameEn(z.getNameEn())
                .nameAr(z.getNameAr())
                .price(z.getPrice())
                .deliveryDays(z.getDeliveryDays())
                .icon(z.getIcon())
                .active(z.isActive())
                .build();
    }
}
