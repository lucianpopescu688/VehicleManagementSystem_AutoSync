package com.AutoSync.vehicle_management_system.dto;

import com.AutoSync.vehicle_management_system.model.AlertType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceAlertDto {
    private UUID id;
    private UUID vehicleId;
    private String vehicleName;
    private AlertType alertType;
    private String message;
    private boolean resolved;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;
}
