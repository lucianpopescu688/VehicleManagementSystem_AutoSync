package com.AutoSync.vehicle_management_system.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.util.UUID;

@Data
public class LogMileageRequest {
    @NotNull
    private UUID vehicleId;

    @NotNull
    @Positive
    private Integer newMileage;
}
