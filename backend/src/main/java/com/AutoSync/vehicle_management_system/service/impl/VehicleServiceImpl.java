package com.AutoSync.vehicle_management_system.service.impl;

import com.AutoSync.vehicle_management_system.dto.CreateVehicleDto;
import com.AutoSync.vehicle_management_system.exception.ResourceNotFoundException;
import com.AutoSync.vehicle_management_system.mapper.VehicleMapper;
import com.AutoSync.vehicle_management_system.model.Role;
import com.AutoSync.vehicle_management_system.model.User;
import com.AutoSync.vehicle_management_system.model.Vehicle;
import com.AutoSync.vehicle_management_system.repository.VehicleRepository;
import com.AutoSync.vehicle_management_system.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VehicleServiceImpl implements VehicleService {

    private final VehicleRepository vehicleRepository;
    private final VehicleMapper vehicleMapper;

    @Override
    @Transactional
    public Vehicle createVehicle(CreateVehicleDto dto) {
        Vehicle vehicle = vehicleMapper.toEntity(dto);
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof User user) {
            vehicle.setOwner(user);
        }
        return vehicleRepository.save(vehicle);
    }

    @Override
    @Transactional
    public Vehicle updateVehicle(UUID id, CreateVehicleDto dto) {
        Vehicle existing = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + id));
        vehicleMapper.updateVehicleFromDto(dto, existing);
        return vehicleRepository.save(existing);
    }

    @Override
    public Vehicle getVehicle(UUID id) {
        return vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + id));
    }

    @Override
    @Transactional
    public void deleteVehicle(UUID id) {
        vehicleRepository.deleteById(id);
    }

    @Override
    public Page<Vehicle> listAll(Pageable pageable) {
        return vehicleRepository.findAll(pageable);
    }

    @Override
    public Page<Vehicle> listAccessibleByUser(UUID userId, Pageable pageable) {
        return vehicleRepository.findAccessibleByUser(userId, pageable);
    }

    @Override
    public Page<Vehicle> listByOwner(UUID ownerId, Pageable pageable) {
        return vehicleRepository.findByOwner_Id(ownerId, pageable);
    }
}
