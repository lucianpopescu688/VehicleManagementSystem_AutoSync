package com.AutoSync.vehicle_management_system.service;

import com.AutoSync.vehicle_management_system.dto.CreateVehicleDto;
import com.AutoSync.vehicle_management_system.model.Vehicle;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface VehicleService {
    Vehicle createVehicle(CreateVehicleDto dto);
    Vehicle updateVehicle(UUID id, CreateVehicleDto dto);
    Vehicle getVehicle(UUID id);
    void deleteVehicle(UUID id);
    Page<Vehicle> listAll(Pageable pageable);
    Page<Vehicle> listAccessibleByUser(UUID userId, Pageable pageable);
    Page<Vehicle> listByOwner(UUID ownerId, Pageable pageable);
}
