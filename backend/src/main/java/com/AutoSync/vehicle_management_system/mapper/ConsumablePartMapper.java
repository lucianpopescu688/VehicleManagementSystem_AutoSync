package com.AutoSync.vehicle_management_system.mapper;

import com.AutoSync.vehicle_management_system.dto.ConsumablePartDto;
import com.AutoSync.vehicle_management_system.model.ConsumablePart;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ConsumablePartMapper {

    @Mapping(target = "vehicleId", source = "vehicle.id")
    ConsumablePartDto toDto(ConsumablePart part);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "vehicle", ignore = true)
    @Mapping(target = "maintenanceRequired", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateFromRequest(com.AutoSync.vehicle_management_system.dto.ConsumablePartRequest request, @MappingTarget ConsumablePart part);
}
