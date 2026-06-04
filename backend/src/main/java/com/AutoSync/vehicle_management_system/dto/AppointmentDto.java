package com.AutoSync.vehicle_management_system.dto;

import com.AutoSync.vehicle_management_system.model.AppointmentStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentDto {
    private UUID id;
    private UUID vehicleId;
    private UUID requestedById;
    private UUID targetShopId;
    private LocalDateTime requestedAt;
    private LocalDateTime scheduledFor;
    private AppointmentStatus status;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}