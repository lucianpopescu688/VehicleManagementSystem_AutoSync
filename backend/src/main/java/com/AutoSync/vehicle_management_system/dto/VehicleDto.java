package com.AutoSync.vehicle_management_system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleDto {
    private Long id;
    private String vin;
    private String name;
    private String model;
    private Integer year;
    private Integer currentMileage;
    private Long assignedDriverId; // null if not assigned
}

