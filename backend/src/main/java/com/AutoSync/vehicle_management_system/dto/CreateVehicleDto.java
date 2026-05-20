package com.AutoSync.vehicle_management_system.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateVehicleDto {
    @NotBlank
    private String vin;

    @NotBlank
    private String name;

    @NotBlank
    private String model;

    @Min(1900)
    private Integer year;

    @NotNull
    private Integer currentMileage;

    private UUID assignedDriverId;
}
