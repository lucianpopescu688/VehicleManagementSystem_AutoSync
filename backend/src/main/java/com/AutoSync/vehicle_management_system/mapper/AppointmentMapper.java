package com.AutoSync.vehicle_management_system.mapper;

import com.AutoSync.vehicle_management_system.dto.AppointmentDto;
import com.AutoSync.vehicle_management_system.model.Appointment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface AppointmentMapper {
    @Mapping(target = "vehicleId", source = "vehicle.id")
    @Mapping(target = "vehicleName", source = "vehicle.name")
    @Mapping(target = "requestedById", source = "requestedBy.id")
    @Mapping(target = "targetShopId", source = "targetShop.id")
    @Mapping(target = "targetShopName", source = "targetShop.name")
    AppointmentDto toDto(Appointment appointment);
}