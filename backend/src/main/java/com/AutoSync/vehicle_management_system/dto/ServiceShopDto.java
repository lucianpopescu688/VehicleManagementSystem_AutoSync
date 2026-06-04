package com.AutoSync.vehicle_management_system.dto;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceShopDto {
    private UUID id;
    private String name;
    private String address;
    private String contactEmail;
    private String contactPhone;
    private Boolean approved;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}