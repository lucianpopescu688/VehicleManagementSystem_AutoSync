package com.AutoSync.vehicle_management_system.service;

import com.AutoSync.vehicle_management_system.model.Vehicle;

import java.util.List;

public interface VehicleService {
    Vehicle createVehicle(Vehicle vehicle);
    Vehicle updateVehicle(Long id, Vehicle vehicle);
    Vehicle getVehicle(Long id);
    void deleteVehicle(Long id);
    List<Vehicle> listAll();
    List<Vehicle> listByOwner(Long ownerId);
}