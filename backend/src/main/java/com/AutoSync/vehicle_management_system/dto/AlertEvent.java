package com.AutoSync.vehicle_management_system.dto;

import com.AutoSync.vehicle_management_system.model.AlertType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlertEvent implements Serializable {
    private static final long serialVersionUID = 1L;

    private String recipientEmail;
    private String recipientName;
    private AlertType alertType;
    private String vehicleName;
    private String vehiclePlate;
    private String message;
}
