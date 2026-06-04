package com.AutoSync.vehicle_management_system.dto;

import com.AutoSync.vehicle_management_system.model.DocumentType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class LegalDocumentRequest {
    @NotNull
    private UUID vehicleId;

    @NotNull
    private DocumentType documentType;

    private String documentNumber;

    @NotNull
    private LocalDate expiryDate;

    private String notes;
}
