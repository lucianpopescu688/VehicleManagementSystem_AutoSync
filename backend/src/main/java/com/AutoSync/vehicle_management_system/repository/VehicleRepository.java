package com.AutoSync.vehicle_management_system.repository;

import com.AutoSync.vehicle_management_system.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    Optional<Vehicle> findByVin(String vin);
    // add queries e.g. findByOwnerId(...)
}