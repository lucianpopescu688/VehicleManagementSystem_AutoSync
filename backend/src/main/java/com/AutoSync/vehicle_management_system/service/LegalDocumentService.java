package com.AutoSync.vehicle_management_system.service;

import com.AutoSync.vehicle_management_system.dto.LegalDocumentRequest;
import com.AutoSync.vehicle_management_system.model.LegalDocument;

import java.util.List;
import java.util.UUID;

public interface LegalDocumentService {
    LegalDocument create(LegalDocumentRequest request);
    LegalDocument update(UUID id, LegalDocumentRequest request);
    void delete(UUID id);
    List<LegalDocument> listByVehicle(UUID vehicleId);
}
