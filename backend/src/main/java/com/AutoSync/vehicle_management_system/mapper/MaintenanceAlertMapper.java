package com.AutoSync.vehicle_management_system.mapper;

import com.AutoSync.vehicle_management_system.dto.MaintenanceAlertDto;
import com.AutoSync.vehicle_management_system.model.MaintenanceAlert;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface MaintenanceAlertMapper {

    @Mapping(target = "vehicleId", source = "vehicle.id")
    @Mapping(target = "vehicleName", source = "vehicle.name")
    MaintenanceAlertDto toDto(MaintenanceAlert alert);
}
