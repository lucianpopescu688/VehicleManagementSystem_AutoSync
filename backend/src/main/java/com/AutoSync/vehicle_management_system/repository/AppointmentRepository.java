package com.AutoSync.vehicle_management_system.repository;

import com.AutoSync.vehicle_management_system.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {
    List<Appointment> findByVehicleId(UUID vehicleId);
    List<Appointment> findByRequestedById(UUID userId);
    List<Appointment> findByTargetShopId(UUID shopId);
}
