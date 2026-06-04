package com.AutoSync.vehicle_management_system.controller;
import com.AutoSync.vehicle_management_system.dto.ServiceShopDto;
import com.AutoSync.vehicle_management_system.dto.ServiceShopRequest;
import com.AutoSync.vehicle_management_system.service.ServiceShopService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/service-shops")
@RequiredArgsConstructor
@Tag(name = "Service Shop", description = "Service Shop management endpoints")
public class ServiceShopController {

    private final ServiceShopService serviceShopService;

    @PostMapping
    @Operation(summary = "Register a new service shop")
    public ResponseEntity<ServiceShopDto> createServiceShop(@Valid @RequestBody ServiceShopRequest request) {
        return new ResponseEntity<>(serviceShopService.createServiceShop(request), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get service shop by ID")
    public ResponseEntity<ServiceShopDto> getServiceShop(@PathVariable UUID id) {
        return ResponseEntity.ok(serviceShopService.getServiceShop(id));
    }

    @GetMapping
    @Operation(summary = "Get all service shops")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ServiceShopDto>> getAllServiceShops() {
        return ResponseEntity.ok(serviceShopService.getAllServiceShops());
    }

    @GetMapping("/approved")
    @Operation(summary = "Get all approved service shops")
    public ResponseEntity<List<ServiceShopDto>> getApprovedServiceShops() {
        return ResponseEntity.ok(serviceShopService.getApprovedServiceShops());
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update service shop details")
    public ResponseEntity<ServiceShopDto> updateServiceShop(@PathVariable UUID id, @Valid @RequestBody ServiceShopRequest request) {
        return ResponseEntity.ok(serviceShopService.updateServiceShop(id, request));
    }
    
    @PatchMapping("/{id}/approve")
    @Operation(summary = "Approve a service shop")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ServiceShopDto> approveServiceShop(@PathVariable UUID id) {
        return ResponseEntity.ok(serviceShopService.approveServiceShop(id));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a service shop")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteServiceShop(@PathVariable UUID id) {
        serviceShopService.deleteServiceShop(id);
        return ResponseEntity.noContent().build();
    }
}