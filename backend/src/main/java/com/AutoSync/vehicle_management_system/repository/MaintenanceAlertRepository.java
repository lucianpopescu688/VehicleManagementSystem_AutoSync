package com.AutoSync.vehicle_management_system.repository;

import com.AutoSync.vehicle_management_system.model.MaintenanceAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MaintenanceAlertRepository extends JpaRepository<MaintenanceAlert, UUID> {
    List<MaintenanceAlert> findByResolvedFalse();

    @Query("SELECT a FROM MaintenanceAlert a WHERE a.resolved = false AND (a.vehicle.owner.id = :userId OR a.vehicle.assignedDriver.id = :userId)")
    List<MaintenanceAlert> findUnresolvedForUser(@Param("userId") UUID userId);

    List<MaintenanceAlert> findByVehicle_IdAndResolvedFalse(UUID vehicleId);
    boolean existsByReferenceIdAndResolvedFalse(String referenceId);
}
