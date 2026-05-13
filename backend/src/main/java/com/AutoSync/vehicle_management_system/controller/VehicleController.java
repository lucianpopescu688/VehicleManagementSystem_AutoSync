package com.AutoSync.vehicle_management_system.controller;

import com.AutoSync.vehicle_management_system.dto.CreateVehicleDto;
import com.AutoSync.vehicle_management_system.dto.VehicleDto;
import com.AutoSync.vehicle_management_system.mapper.VehicleMapper;
import com.AutoSync.vehicle_management_system.model.Vehicle;
import com.AutoSync.vehicle_management_system.service.VehicleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/vehicles")
@RequiredArgsConstructor
public class VehicleController {
    private final VehicleService vehicleService;
    private final VehicleMapper vehicleMapper;

    @PostMapping
    public ResponseEntity<VehicleDto> create(@RequestBody @Valid CreateVehicleDto dto) {
        Vehicle created = vehicleService.createVehicle(vehicleMapper.toEntity(dto));
        return ResponseEntity.status(HttpStatus.CREATED).body(vehicleMapper.toDto(created));
    }

    @GetMapping("/{id}")
    public ResponseEntity<VehicleDto> get(@PathVariable Long id) {
        return ResponseEntity.ok(vehicleMapper.toDto(vehicleService.getVehicle(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<VehicleDto> update(@PathVariable Long id, @RequestBody @Valid CreateVehicleDto dto) {
        Vehicle updated = vehicleService.updateVehicle(id, vehicleMapper.toEntity(dto));
        return ResponseEntity.ok(vehicleMapper.toDto(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        vehicleService.deleteVehicle(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<VehicleDto>> list() {
        List<Vehicle> vehicles = vehicleService.listAll();
        List<VehicleDto> dtos = vehicles.stream()
                .map(vehicleMapper::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<VehicleDto>> listByOwner(@PathVariable Long ownerId) {
        List<Vehicle> vehicles = vehicleService.listByOwner(ownerId);
        List<VehicleDto> dtos = vehicles.stream()
                .map(vehicleMapper::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
}