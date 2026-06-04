package com.AutoSync.vehicle_management_system.service;

import com.AutoSync.vehicle_management_system.exception.ResourceNotFoundException;
import com.AutoSync.vehicle_management_system.model.MaintenanceAlert;
import com.AutoSync.vehicle_management_system.model.User;
import com.AutoSync.vehicle_management_system.repository.MaintenanceAlertRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AlertService {

    private final MaintenanceAlertRepository alertRepository;

    public List<MaintenanceAlert> getUnresolved() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof User user) {
            return alertRepository.findUnresolvedForUser(user.getId());
        }
        return alertRepository.findByResolvedFalse();
    }

    public List<MaintenanceAlert> getAll() {
        return alertRepository.findAll();
    }

    public List<MaintenanceAlert> getUnresolvedForVehicle(UUID vehicleId) {
        return alertRepository.findByVehicle_IdAndResolvedFalse(vehicleId);
    }

    @Transactional
    public MaintenanceAlert resolve(UUID id) {
        MaintenanceAlert alert = alertRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alert not found: " + id));
        alert.setResolved(true);
        alert.setResolvedAt(LocalDateTime.now());
        return alertRepository.save(alert);
    }
}
