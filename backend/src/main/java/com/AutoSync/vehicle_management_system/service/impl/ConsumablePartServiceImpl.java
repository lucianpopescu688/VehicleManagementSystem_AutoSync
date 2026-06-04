package com.AutoSync.vehicle_management_system.service.impl;

import com.AutoSync.vehicle_management_system.dto.ConsumablePartRequest;
import com.AutoSync.vehicle_management_system.exception.ResourceNotFoundException;
import com.AutoSync.vehicle_management_system.mapper.ConsumablePartMapper;
import com.AutoSync.vehicle_management_system.model.ConsumablePart;
import com.AutoSync.vehicle_management_system.model.Vehicle;
import com.AutoSync.vehicle_management_system.repository.ConsumablePartRepository;
import com.AutoSync.vehicle_management_system.repository.VehicleRepository;
import com.AutoSync.vehicle_management_system.service.ConsumablePartService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ConsumablePartServiceImpl implements ConsumablePartService {

    private final ConsumablePartRepository consumablePartRepository;
    private final VehicleRepository vehicleRepository;
    private final ConsumablePartMapper mapper;

    @Override
    @Transactional
    public ConsumablePart create(ConsumablePartRequest request) {
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found: " + request.getVehicleId()));
        ConsumablePart part = ConsumablePart.builder()
                .vehicle(vehicle)
                .partName(request.getPartName())
                .lifespanKm(request.getLifespanKm())
                .lastReplacedMileage(request.getLastReplacedMileage())
                .notes(request.getNotes())
                .build();
        return consumablePartRepository.save(part);
    }

    @Override
    @Transactional
    public ConsumablePart update(UUID id, ConsumablePartRequest request) {
        ConsumablePart part = consumablePartRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Consumable part not found: " + id));
        mapper.updateFromRequest(request, part);
        part.setMaintenanceRequired(false);
        return consumablePartRepository.save(part);
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        consumablePartRepository.deleteById(id);
    }

    @Override
    public List<ConsumablePart> listByVehicle(UUID vehicleId) {
        return consumablePartRepository.findByVehicle_Id(vehicleId);
    }
}
