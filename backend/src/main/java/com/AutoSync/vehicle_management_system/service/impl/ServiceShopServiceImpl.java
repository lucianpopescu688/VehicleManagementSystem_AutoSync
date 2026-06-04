package com.AutoSync.vehicle_management_system.service.impl;
import com.AutoSync.vehicle_management_system.dto.ServiceShopDto;
import com.AutoSync.vehicle_management_system.dto.ServiceShopRequest;
import com.AutoSync.vehicle_management_system.exception.ResourceNotFoundException;
import com.AutoSync.vehicle_management_system.mapper.ServiceShopMapper;
import com.AutoSync.vehicle_management_system.model.ServiceShop;
import com.AutoSync.vehicle_management_system.repository.ServiceShopRepository;
import com.AutoSync.vehicle_management_system.service.ServiceShopService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServiceShopServiceImpl implements ServiceShopService {
    private final ServiceShopRepository serviceShopRepository;
    private final ServiceShopMapper serviceShopMapper;

    @Override
    @Transactional
    public ServiceShopDto createServiceShop(ServiceShopRequest request) {
        ServiceShop serviceShop = serviceShopMapper.toEntity(request);
        serviceShop.setApproved(false);
        ServiceShop saved = serviceShopRepository.save(serviceShop);
        return serviceShopMapper.toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ServiceShopDto getServiceShop(UUID id) {
        ServiceShop serviceShop = serviceShopRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service shop not found"));
        return serviceShopMapper.toDto(serviceShop);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceShopDto> getAllServiceShops() {
        return serviceShopRepository.findAll().stream()
                .map(serviceShopMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceShopDto> getApprovedServiceShops() {
        return serviceShopRepository.findByApprovedTrue().stream()
                .map(serviceShopMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ServiceShopDto updateServiceShop(UUID id, ServiceShopRequest request) {
        ServiceShop serviceShop = serviceShopRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service shop not found"));
        serviceShopMapper.updateEntityFromRequest(request, serviceShop);
        return serviceShopMapper.toDto(serviceShopRepository.save(serviceShop));
    }
    
    @Override
    @Transactional
    public ServiceShopDto approveServiceShop(UUID id) {
        ServiceShop serviceShop = serviceShopRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service shop not found"));
        serviceShop.setApproved(true);
        return serviceShopMapper.toDto(serviceShopRepository.save(serviceShop));
    }

    @Override
    @Transactional
    public void deleteServiceShop(UUID id) {
        ServiceShop serviceShop = serviceShopRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service shop not found"));
        serviceShopRepository.delete(serviceShop);
    }
}