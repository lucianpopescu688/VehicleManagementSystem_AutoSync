package com.AutoSync.vehicle_management_system.dto;

import com.AutoSync.vehicle_management_system.model.DocumentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LegalDocumentDto {
    private UUID id;
    private UUID vehicleId;
    private DocumentType documentType;
    private String documentNumber;
    private LocalDate expiryDate;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
