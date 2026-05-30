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
public class MileageLogDto {
    private UUID id;
    private UUID vehicleId;
    private Integer recordedMileage;
    private UUID recordedById;
    private LocalDateTime createdAt;
}
