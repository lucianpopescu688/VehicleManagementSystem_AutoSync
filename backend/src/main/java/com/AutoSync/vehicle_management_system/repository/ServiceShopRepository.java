package com.AutoSync.vehicle_management_system.repository;

import com.AutoSync.vehicle_management_system.model.ServiceShop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;
import java.util.List;

@Repository
public interface ServiceShopRepository extends JpaRepository<ServiceShop, UUID> {
    List<ServiceShop> findByApprovedTrue();
}
