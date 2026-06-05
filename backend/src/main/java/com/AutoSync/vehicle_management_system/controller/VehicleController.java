package com.AutoSync.vehicle_management_system.controller;

import com.AutoSync.vehicle_management_system.dto.CreateVehicleDto;
import com.AutoSync.vehicle_management_system.dto.VehicleDto;
import com.AutoSync.vehicle_management_system.mapper.VehicleMapper;
import com.AutoSync.vehicle_management_system.model.Vehicle;
import com.AutoSync.vehicle_management_system.service.VehicleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.AutoSync.vehicle_management_system.model.User;
import com.AutoSync.vehicle_management_system.model.Role;

import java.util.UUID;

@RestController
@RequestMapping("/v1/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;
    private final VehicleMapper vehicleMapper;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'STANDARD_USER')")
    public ResponseEntity<VehicleDto> create(@RequestBody @Valid CreateVehicleDto dto) {
        Vehicle created = vehicleService.createVehicle(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(vehicleMapper.toDto(created));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'STANDARD_USER', 'FLEET_DRIVER') and @vehicleAccess.canAccessVehicle(#id)")
    public ResponseEntity<VehicleDto> get(@PathVariable UUID id) {
        return ResponseEntity.ok(vehicleMapper.toDto(vehicleService.getVehicle(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'STANDARD_USER') and @vehicleAccess.canAccessVehicle(#id)")
    public ResponseEntity<VehicleDto> update(@PathVariable UUID id, @RequestBody @Valid CreateVehicleDto dto) {
        return ResponseEntity.ok(vehicleMapper.toDto(vehicleService.updateVehicle(id, dto)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'STANDARD_USER') and @vehicleAccess.canAccessVehicle(#id)")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        vehicleService.deleteVehicle(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'STANDARD_USER', 'FLEET_DRIVER')")
    public ResponseEntity<Page<VehicleDto>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "name") String sort,
            @AuthenticationPrincipal User user) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(sort));
        if (user.getRole() == Role.ADMIN) {
            return ResponseEntity.ok(vehicleService.listAll(pageable).map(vehicleMapper::toDto));
        }
        return ResponseEntity.ok(vehicleService.listAccessibleByUser(user.getId(), pageable).map(vehicleMapper::toDto));
    }

    @GetMapping("/owner/{ownerId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER') or #ownerId == authentication.principal.id")
    public ResponseEntity<Page<VehicleDto>> listByOwner(
            @PathVariable UUID ownerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(vehicleService.listByOwner(ownerId, pageable).map(vehicleMapper::toDto));
    }
}
