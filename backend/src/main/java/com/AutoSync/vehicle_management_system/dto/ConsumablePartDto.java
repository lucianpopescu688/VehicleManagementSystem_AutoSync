package com.AutoSync.vehicle_management_system.dto;

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
public class ConsumablePartDto {
    private UUID id;
    private UUID vehicleId;
    private String partName;
    private Integer lifespanKm;
    private Integer lastReplacedMileage;
    private boolean maintenanceRequired;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
