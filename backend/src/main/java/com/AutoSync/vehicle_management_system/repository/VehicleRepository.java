package com.AutoSync.vehicle_management_system.repository;

import com.AutoSync.vehicle_management_system.model.Vehicle;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, UUID> {
    Optional<Vehicle> findByVin(String vin);
    Page<Vehicle> findByOwner_Id(UUID ownerId, Pageable pageable);
    Page<Vehicle> findByAssignedDriver_Id(UUID driverId, Pageable pageable);
}
