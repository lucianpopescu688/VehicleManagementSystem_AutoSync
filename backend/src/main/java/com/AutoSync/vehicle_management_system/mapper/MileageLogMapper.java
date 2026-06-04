package com.AutoSync.vehicle_management_system.mapper;

import com.AutoSync.vehicle_management_system.dto.MileageLogDto;
import com.AutoSync.vehicle_management_system.model.MileageLog;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface MileageLogMapper {

    @Mapping(target = "vehicleId", source = "vehicle.id")
    @Mapping(target = "recordedById", source = "recordedBy.id")
    MileageLogDto toDto(MileageLog log);
}
