package com.AutoSync.vehicle_management_system.mapper;

import com.AutoSync.vehicle_management_system.dto.CreateVehicleDto;
import com.AutoSync.vehicle_management_system.dto.VehicleDto;
import com.AutoSync.vehicle_management_system.model.User;
import com.AutoSync.vehicle_management_system.model.Vehicle;
import com.AutoSync.vehicle_management_system.repository.UserRepository;
import org.mapstruct.*;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.UUID;

@Mapper(componentModel = "spring")
public abstract class VehicleMapper {

    @Autowired
    protected UserRepository userRepository;

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "owner", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "assignedDriver", expression = "java(resolveUser(dto.getAssignedDriverId()))")
    public abstract Vehicle toEntity(CreateVehicleDto dto);

    @Mapping(target = "assignedDriverId", source = "assignedDriver.id")
    @Mapping(target = "ownerId", source = "owner.id")
    public abstract VehicleDto toDto(Vehicle vehicle);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "owner", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "assignedDriver", expression = "java(resolveUser(dto.getAssignedDriverId()))")
    public abstract void updateVehicleFromDto(CreateVehicleDto dto, @MappingTarget Vehicle vehicle);

    protected User resolveUser(UUID userId) {
        if (userId == null) return null;
        return userRepository.findById(userId).orElse(null);
    }
}
