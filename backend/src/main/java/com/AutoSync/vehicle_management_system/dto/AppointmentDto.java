package com.AutoSync.vehicle_management_system.dto;

import com.AutoSync.vehicle_management_system.model.AppointmentStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentDto {
    private UUID id;
    private UUID vehicleId;
    private String vehicleName;
    private UUID requestedById;
    private UUID targetShopId;
    private String targetShopName;
    private LocalDateTime requestedAt;
    private LocalDateTime scheduledFor;
    private AppointmentStatus status;
    private String notes;
    private Integer recordedMileage;
    private BigDecimal totalCost;
    private String mechanicNotes;
    private LocalDateTime completedAt;
    private UUID completedById;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}