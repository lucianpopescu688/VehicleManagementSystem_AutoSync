package com.AutoSync.vehicle_management_system.dto;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceShopRequest {
    @NotBlank(message = "Name is required")
    private String name;
    private String address;
    private String contactEmail;
    private String contactPhone;
}