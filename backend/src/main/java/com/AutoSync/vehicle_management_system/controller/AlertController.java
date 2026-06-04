package com.AutoSync.vehicle_management_system.controller;

import com.AutoSync.vehicle_management_system.dto.MaintenanceAlertDto;
import com.AutoSync.vehicle_management_system.mapper.MaintenanceAlertMapper;
import com.AutoSync.vehicle_management_system.service.AlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;
    private final MaintenanceAlertMapper mapper;

    @GetMapping
    public ResponseEntity<List<MaintenanceAlertDto>> getUnresolved() {
        return ResponseEntity.ok(alertService.getUnresolved()
                .stream().map(mapper::toDto).toList());
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<MaintenanceAlertDto>> getAll() {
        return ResponseEntity.ok(alertService.getAll()
                .stream().map(mapper::toDto).toList());
    }

    @GetMapping("/vehicles/{vehicleId}")
    @PreAuthorize("@vehicleAccess.canAccessVehicle(#vehicleId)")
    public ResponseEntity<List<MaintenanceAlertDto>> getUnresolvedForVehicle(@PathVariable UUID vehicleId) {
        return ResponseEntity.ok(alertService.getUnresolvedForVehicle(vehicleId)
                .stream().map(mapper::toDto).toList());
    }

    @PostMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'STANDARD_USER') and @vehicleAccess.canAccessAlert(#id)")
    public ResponseEntity<MaintenanceAlertDto> resolve(@PathVariable UUID id) {
        return ResponseEntity.ok(mapper.toDto(alertService.resolve(id)));
    }
}
