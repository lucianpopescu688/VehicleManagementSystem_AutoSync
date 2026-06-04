package com.AutoSync.vehicle_management_system.service;
import com.AutoSync.vehicle_management_system.dto.ServiceShopDto;
import com.AutoSync.vehicle_management_system.dto.ServiceShopRequest;
import java.util.List;
import java.util.UUID;

public interface ServiceShopService {
    ServiceShopDto createServiceShop(ServiceShopRequest request);
    ServiceShopDto getServiceShop(UUID id);
    List<ServiceShopDto> getAllServiceShops();
    List<ServiceShopDto> getApprovedServiceShops();
    ServiceShopDto updateServiceShop(UUID id, ServiceShopRequest request);
    ServiceShopDto approveServiceShop(UUID id);
    void deleteServiceShop(UUID id);
}