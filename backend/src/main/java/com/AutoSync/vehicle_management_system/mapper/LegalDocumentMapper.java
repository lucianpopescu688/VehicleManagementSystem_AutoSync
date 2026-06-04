package com.AutoSync.vehicle_management_system.mapper;

import com.AutoSync.vehicle_management_system.dto.LegalDocumentDto;
import com.AutoSync.vehicle_management_system.model.LegalDocument;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface LegalDocumentMapper {

    @Mapping(target = "vehicleId", source = "vehicle.id")
    LegalDocumentDto toDto(LegalDocument document);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "vehicle", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateFromRequest(com.AutoSync.vehicle_management_system.dto.LegalDocumentRequest request, @MappingTarget LegalDocument document);
}
