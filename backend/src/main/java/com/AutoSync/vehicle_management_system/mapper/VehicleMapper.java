package com.AutoSync.vehicle_management_system.mapper;

import com.AutoSync.vehicle_management_system.dto.CreateVehicleDto;
import com.AutoSync.vehicle_management_system.dto.VehicleDto;
import com.AutoSync.vehicle_management_system.model.Vehicle;
import com.AutoSync.vehicle_management_system.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class VehicleMapper {
    private final UserRepository userRepository;

    /**
     * Convert CreateVehicleDto to Vehicle entity
     */
    public Vehicle toEntity(CreateVehicleDto dto) {
        if (dto == null) {
            return null;
        }
        Vehicle v = new Vehicle();
        v.setVin(dto.getVin());
        v.setName(dto.getName());
        v.setModel(dto.getModel());
        v.setYear(dto.getYear());
        v.setCurrentMileage(dto.getCurrentMileage());

        if (dto.getAssignedDriverId() != null) {
            userRepository.findById(dto.getAssignedDriverId()).ifPresent(v::setAssignedDriver);
        }
        return v;
    }

    /**
     * Convert Vehicle entity to VehicleDto
     */
    public VehicleDto toDto(Vehicle vehicle) {
        if (vehicle == null) {
            return null;
        }
        Long driverId = vehicle.getAssignedDriver() != null ? vehicle.getAssignedDriver().getId() : null;
        return VehicleDto.builder()
                .id(vehicle.getId())
                .vin(vehicle.getVin())
                .name(vehicle.getName())
                .model(vehicle.getModel())
                .year(vehicle.getYear())
                .currentMileage(vehicle.getCurrentMileage())
                .assignedDriverId(driverId)
                .build();
    }
}

