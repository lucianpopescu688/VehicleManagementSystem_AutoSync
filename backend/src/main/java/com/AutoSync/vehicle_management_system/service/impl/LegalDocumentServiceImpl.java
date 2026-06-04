package com.AutoSync.vehicle_management_system.service.impl;

import com.AutoSync.vehicle_management_system.dto.LegalDocumentRequest;
import com.AutoSync.vehicle_management_system.exception.ResourceNotFoundException;
import com.AutoSync.vehicle_management_system.mapper.LegalDocumentMapper;
import com.AutoSync.vehicle_management_system.model.LegalDocument;
import com.AutoSync.vehicle_management_system.model.Vehicle;
import com.AutoSync.vehicle_management_system.repository.LegalDocumentRepository;
import com.AutoSync.vehicle_management_system.repository.VehicleRepository;
import com.AutoSync.vehicle_management_system.service.LegalDocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LegalDocumentServiceImpl implements LegalDocumentService {

    private final LegalDocumentRepository legalDocumentRepository;
    private final VehicleRepository vehicleRepository;
    private final LegalDocumentMapper mapper;

    @Override
    @Transactional
    public LegalDocument create(LegalDocumentRequest request) {
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found: " + request.getVehicleId()));
        LegalDocument doc = LegalDocument.builder()
                .vehicle(vehicle)
                .documentType(request.getDocumentType())
                .documentNumber(request.getDocumentNumber())
                .expiryDate(request.getExpiryDate())
                .notes(request.getNotes())
                .build();
        return legalDocumentRepository.save(doc);
    }

    @Override
    @Transactional
    public LegalDocument update(UUID id, LegalDocumentRequest request) {
        LegalDocument doc = legalDocumentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Legal document not found: " + id));
        mapper.updateFromRequest(request, doc);
        return legalDocumentRepository.save(doc);
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        legalDocumentRepository.deleteById(id);
    }

    @Override
    public List<LegalDocument> listByVehicle(UUID vehicleId) {
        return legalDocumentRepository.findByVehicle_Id(vehicleId);
    }
}
