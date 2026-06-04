package com.AutoSync.vehicle_management_system.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentRequest {
    @NotNull(message = "Vehicle ID is required")
    private UUID vehicleId;
    
    @NotNull(message = "Target Shop ID is required")
    private UUID targetShopId;
    
    private LocalDateTime scheduledFor;
    
    private String notes;
}