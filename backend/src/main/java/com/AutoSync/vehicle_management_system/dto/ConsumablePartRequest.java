package com.AutoSync.vehicle_management_system.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.util.UUID;

@Data
public class ConsumablePartRequest {
    @NotNull
    private UUID vehicleId;

    @NotBlank
    private String partName;

    @NotNull
    @Positive
    private Integer lifespanKm;

    @NotNull
    @Positive
    private Integer lastReplacedMileage;

    private String notes;
}
