package com.AutoSync.vehicle_management_system.service.impl;

import com.AutoSync.vehicle_management_system.dto.LogMileageRequest;
import com.AutoSync.vehicle_management_system.exception.BadRequestException;
import com.AutoSync.vehicle_management_system.exception.ResourceNotFoundException;
import com.AutoSync.vehicle_management_system.model.MileageLog;
import com.AutoSync.vehicle_management_system.model.User;
import com.AutoSync.vehicle_management_system.model.Vehicle;
import com.AutoSync.vehicle_management_system.repository.MileageLogRepository;
import com.AutoSync.vehicle_management_system.repository.VehicleRepository;
import com.AutoSync.vehicle_management_system.service.MileageService;
import com.AutoSync.vehicle_management_system.service.MonitoringService;
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
public class MileageServiceImpl implements MileageService {

    private final VehicleRepository vehicleRepository;
    private final MileageLogRepository mileageLogRepository;
    private final MonitoringService monitoringService;

    @Override
    @Transactional
    public MileageLog logMileage(LogMileageRequest request) {
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found: " + request.getVehicleId()));

        if (request.getNewMileage() <= vehicle.getCurrentMileage()) {
            throw new BadRequestException(
                    "Entered mileage must be greater than the last recorded value (%d km). Please verify."
                            .formatted(vehicle.getCurrentMileage())
            );
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = (auth != null && auth.getPrincipal() instanceof User u) ? u : null;

        vehicle.setCurrentMileage(request.getNewMileage());
        vehicleRepository.save(vehicle);

        MileageLog log = MileageLog.builder()
                .vehicle(vehicle)
                .recordedMileage(request.getNewMileage())
                .recordedBy(currentUser)
                .build();
        MileageLog saved = mileageLogRepository.save(log);

        monitoringService.checkVehicleAfterMileageUpdate(vehicle);

        return saved;
    }

    @Override
    public Page<MileageLog> getHistory(UUID vehicleId, Pageable pageable) {
        return mileageLogRepository.findByVehicle_IdOrderByCreatedAtDesc(vehicleId, pageable);
    }
}
