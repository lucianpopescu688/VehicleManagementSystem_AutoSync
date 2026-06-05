package com.AutoSync.vehicle_management_system.security.dto;

import com.AutoSync.vehicle_management_system.model.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RegisterRequest {
    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private Role role;
    
    // Optional: ID of an existing service shop to join
    private java.util.UUID serviceShopId;
    
    // Optional: Details to create a brand new service shop
    private com.AutoSync.vehicle_management_system.dto.ServiceShopRequest newServiceShop;
}