package com.AutoSync.vehicle_management_system.controller;

import com.AutoSync.vehicle_management_system.dto.LegalDocumentDto;
import com.AutoSync.vehicle_management_system.dto.LegalDocumentRequest;
import com.AutoSync.vehicle_management_system.mapper.LegalDocumentMapper;
import com.AutoSync.vehicle_management_system.service.LegalDocumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/legal-documents")
@RequiredArgsConstructor
public class LegalDocumentController {

    private final LegalDocumentService legalDocumentService;
    private final LegalDocumentMapper mapper;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'STANDARD_USER') and @vehicleAccess.canAccessVehicle(#request.vehicleId)")
    public ResponseEntity<LegalDocumentDto> create(@RequestBody @Valid LegalDocumentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(mapper.toDto(legalDocumentService.create(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'STANDARD_USER') and @vehicleAccess.canAccessDocument(#id)")
    public ResponseEntity<LegalDocumentDto> update(@PathVariable UUID id,
                                                   @RequestBody @Valid LegalDocumentRequest request) {
        return ResponseEntity.ok(mapper.toDto(legalDocumentService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'STANDARD_USER') and @vehicleAccess.canAccessDocument(#id)")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        legalDocumentService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/vehicles/{vehicleId}")
    @PreAuthorize("@vehicleAccess.canAccessVehicle(#vehicleId)")
    public ResponseEntity<List<LegalDocumentDto>> listByVehicle(@PathVariable UUID vehicleId) {
        return ResponseEntity.ok(legalDocumentService.listByVehicle(vehicleId)
                .stream().map(mapper::toDto).toList());
    }
}
