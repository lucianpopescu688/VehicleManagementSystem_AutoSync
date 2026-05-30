package com.AutoSync.vehicle_management_system.controller;

import com.AutoSync.vehicle_management_system.dto.ConsumablePartDto;
import com.AutoSync.vehicle_management_system.dto.ConsumablePartRequest;
import com.AutoSync.vehicle_management_system.mapper.ConsumablePartMapper;
import com.AutoSync.vehicle_management_system.service.ConsumablePartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/consumable-parts")
@RequiredArgsConstructor
public class ConsumablePartController {

    private final ConsumablePartService consumablePartService;
    private final ConsumablePartMapper mapper;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'STANDARD_USER') and @vehicleAccess.canAccessVehicle(#request.vehicleId)")
    public ResponseEntity<ConsumablePartDto> create(@RequestBody @Valid ConsumablePartRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(mapper.toDto(consumablePartService.create(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'STANDARD_USER') and @vehicleAccess.canAccessPart(#id)")
    public ResponseEntity<ConsumablePartDto> update(@PathVariable UUID id,
                                                    @RequestBody @Valid ConsumablePartRequest request) {
        return ResponseEntity.ok(mapper.toDto(consumablePartService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'STANDARD_USER') and @vehicleAccess.canAccessPart(#id)")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        consumablePartService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/vehicles/{vehicleId}")
    @PreAuthorize("@vehicleAccess.canAccessVehicle(#vehicleId)")
    public ResponseEntity<List<ConsumablePartDto>> listByVehicle(@PathVariable UUID vehicleId) {
        return ResponseEntity.ok(consumablePartService.listByVehicle(vehicleId)
                .stream().map(mapper::toDto).toList());
    }
}
