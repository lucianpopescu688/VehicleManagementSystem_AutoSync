package com.AutoSync.vehicle_management_system.repository;

import com.AutoSync.vehicle_management_system.model.MileageLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface MileageLogRepository extends JpaRepository<MileageLog, UUID> {
    Page<MileageLog> findByVehicle_IdOrderByCreatedAtDesc(UUID vehicleId, Pageable pageable);
}
