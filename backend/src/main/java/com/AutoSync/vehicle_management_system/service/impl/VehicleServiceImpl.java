package com.AutoSync.vehicle_management_system.service.impl;

import com.AutoSync.vehicle_management_system.exception.ResourceNotFoundException;
import com.AutoSync.vehicle_management_system.model.Vehicle;
import com.AutoSync.vehicle_management_system.repository.VehicleRepository;
import com.AutoSync.vehicle_management_system.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VehicleServiceImpl implements VehicleService {
    private final VehicleRepository vehicleRepository;

    @Override
    @Transactional
    public Vehicle createVehicle(Vehicle vehicle) {
        return vehicleRepository.save(vehicle);
    }

    @Override
    @Transactional
    public Vehicle updateVehicle(Long id, Vehicle vehicle) {
        Vehicle existing = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + id));
        existing.setVin(vehicle.getVin());
        existing.setName(vehicle.getName());
        existing.setModel(vehicle.getModel());
        existing.setYear(vehicle.getYear());
        existing.setCurrentMileage(vehicle.getCurrentMileage());
        existing.setAssignedDriver(vehicle.getAssignedDriver());
        return vehicleRepository.save(existing);
    }

    @Override
    public Vehicle getVehicle(Long id) {
        return vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + id));
    }

    @Override
    @Transactional
    public void deleteVehicle(Long id) {
        vehicleRepository.deleteById(id);
    }

    @Override
    public List<Vehicle> listAll() {
        return vehicleRepository.findAll();
    }

    @Override
    public List<Vehicle> listByOwner(Long ownerId) {
        // Vehicle has no explicit owner field; fallback: filter by assignedDriver id
        return vehicleRepository.findAll().stream()
                .filter(v -> v.getAssignedDriver() != null && Objects.equals(v.getAssignedDriver().getId(), ownerId))
                .collect(Collectors.toList());
    }
}

