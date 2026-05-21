package com.AutoSync.vehicle_management_system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleDto {
    private UUID id;
    private String vin;
    private String name;
    private String model;
    private Integer year;
    private Integer currentMileage;
    private UUID assignedDriverId;
    private UUID ownerId;
}
