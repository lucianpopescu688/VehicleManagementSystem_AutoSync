package com.AutoSync.vehicle_management_system.mapper;
import com.AutoSync.vehicle_management_system.dto.ServiceShopDto;
import com.AutoSync.vehicle_management_system.dto.ServiceShopRequest;
import com.AutoSync.vehicle_management_system.model.ServiceShop;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ServiceShopMapper {
    ServiceShopDto toDto(ServiceShop serviceShop);
    
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "approved", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    ServiceShop toEntity(ServiceShopRequest request);
    
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "approved", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntityFromRequest(ServiceShopRequest request, @MappingTarget ServiceShop serviceShop);
}