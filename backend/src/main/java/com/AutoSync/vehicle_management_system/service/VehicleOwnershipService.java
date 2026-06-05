package com.AutoSync.vehicle_management_system.service;

import com.AutoSync.vehicle_management_system.model.Role;
import com.AutoSync.vehicle_management_system.model.User;
import com.AutoSync.vehicle_management_system.model.Vehicle;
import com.AutoSync.vehicle_management_system.repository.ConsumablePartRepository;
import com.AutoSync.vehicle_management_system.repository.LegalDocumentRepository;
import com.AutoSync.vehicle_management_system.repository.MaintenanceAlertRepository;
import com.AutoSync.vehicle_management_system.repository.AppointmentRepository;
import com.AutoSync.vehicle_management_system.model.Appointment;
import com.AutoSync.vehicle_management_system.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Objects;
import java.util.UUID;

@Component("vehicleAccess")
@RequiredArgsConstructor
public class VehicleOwnershipService {

    private final VehicleRepository vehicleRepository;
    private final ConsumablePartRepository consumablePartRepository;
    private final LegalDocumentRepository legalDocumentRepository;
    private final MaintenanceAlertRepository alertRepository;
    private final AppointmentRepository appointmentRepository;

    public boolean canCompleteAppointment(UUID appointmentId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof User user)) return false;
        if (user.getRole() == Role.ADMIN) return true;

        return appointmentRepository.findById(appointmentId)
                .map(Appointment::getTargetShop)
                .map(shop -> Objects.equals(shop.getId(), user.getServiceShopId()))
                .orElse(true);
    }

    public boolean canAccessAppointment(UUID appointmentId) {
        return appointmentRepository.findById(appointmentId)
                .map(Appointment::getVehicle)
                .map(this::isAllowed)
                .orElse(true);
    }

    public boolean canAccessVehicle(UUID vehicleId) {
        return vehicleRepository.findById(vehicleId)
                .map(this::isAllowed)
                .orElse(true);
    }

    public boolean canAccessPart(UUID partId) {
        return consumablePartRepository.findById(partId)
                .map(p -> isAllowed(p.getVehicle()))
                .orElse(true);
    }

    public boolean canAccessDocument(UUID docId) {
        return legalDocumentRepository.findById(docId)
                .map(d -> isAllowed(d.getVehicle()))
                .orElse(true);
    }

    public boolean canAccessAlert(UUID alertId) {
        return alertRepository.findById(alertId)
                .map(a -> isAllowed(a.getVehicle()))
                .orElse(true);
    }

    private boolean isAllowed(Vehicle vehicle) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof User user)) return false;
        if (user.getRole() == Role.ADMIN) return true;
        UUID ownerId = vehicle.getOwner() != null ? vehicle.getOwner().getId() : null;
        UUID driverId = vehicle.getAssignedDriver() != null ? vehicle.getAssignedDriver().getId() : null;
        return Objects.equals(ownerId, user.getId()) || Objects.equals(driverId, user.getId());
    }
}
