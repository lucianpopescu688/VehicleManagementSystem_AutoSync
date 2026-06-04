package com.AutoSync.vehicle_management_system.repository;

import com.AutoSync.vehicle_management_system.model.ConsumablePart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ConsumablePartRepository extends JpaRepository<ConsumablePart, UUID> {
    List<ConsumablePart> findByVehicle_Id(UUID vehicleId);
    List<ConsumablePart> findByMaintenanceRequiredTrue();
}
