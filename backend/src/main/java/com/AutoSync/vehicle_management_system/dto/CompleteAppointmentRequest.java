package com.AutoSync.vehicle_management_system.dto;

import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Payload for POST /v1/appointments/{id}/complete.
 * resetPartIds / resolveAlertIds are optional: when null or empty the completion
 * falls back to resetting every part needing maintenance and resolving every open
 * alert on the vehicle.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompleteAppointmentRequest {

    @PositiveOrZero(message = "Recorded mileage cannot be negative")
    private Integer recordedMileage;

    @PositiveOrZero(message = "Total cost cannot be negative")
    private BigDecimal totalCost;

    private String mechanicNotes;

    private List<UUID> resetPartIds;

    private List<UUID> resolveAlertIds;
}
