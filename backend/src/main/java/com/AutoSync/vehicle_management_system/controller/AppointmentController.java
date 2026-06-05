package com.AutoSync.vehicle_management_system.controller;

import com.AutoSync.vehicle_management_system.dto.AppointmentDto;
import com.AutoSync.vehicle_management_system.dto.AppointmentRequest;
import com.AutoSync.vehicle_management_system.model.AppointmentStatus;
import com.AutoSync.vehicle_management_system.model.User;
import com.AutoSync.vehicle_management_system.service.AppointmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/appointments")
@RequiredArgsConstructor
@Tag(name = "Appointment", description = "Appointment management endpoints")
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping
    @Operation(summary = "Create a new appointment")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'STANDARD_USER') and @vehicleAccess.canAccessVehicle(#request.vehicleId)")
    public ResponseEntity<AppointmentDto> createAppointment(
            @Valid @RequestBody AppointmentRequest request,
            @AuthenticationPrincipal User user) {
        return new ResponseEntity<>(appointmentService.createAppointment(request, user.getId()), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get appointment by ID")
    public ResponseEntity<AppointmentDto> getAppointment(@PathVariable UUID id) {
        return ResponseEntity.ok(appointmentService.getAppointment(id));
    }

    @GetMapping("/vehicle/{vehicleId}")
    @Operation(summary = "Get appointments for a vehicle")
    public ResponseEntity<List<AppointmentDto>> getAppointmentsByVehicle(@PathVariable UUID vehicleId) {
        return ResponseEntity.ok(appointmentService.getAppointmentsByVehicle(vehicleId));
    }

    @GetMapping("/my-requests")
    @Operation(summary = "Get appointments requested by current user")
    public ResponseEntity<List<AppointmentDto>> getMyRequestedAppointments(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(appointmentService.getAppointmentsByRequestedBy(user.getId()));
    }

    @GetMapping("/shop/my-appointments")
    @Operation(summary = "Get appointments for the logged-in representative's service shop")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('SERVICE_SHOP_REPRESENTATIVE')")
    public ResponseEntity<List<AppointmentDto>> getAppointmentsByShop(@AuthenticationPrincipal User user) {
        if (user.getServiceShopId() == null) {
            throw new com.AutoSync.vehicle_management_system.exception.BadRequestException("User is not associated with a service shop");
        }
        return ResponseEntity.ok(appointmentService.getAppointmentsByShop(user.getServiceShopId()));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update appointment status")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'SERVICE_SHOP_REPRESENTATIVE')")
    public ResponseEntity<AppointmentDto> updateAppointmentStatus(
            @PathVariable UUID id,
            @RequestParam AppointmentStatus status) {
        return ResponseEntity.ok(appointmentService.updateAppointmentStatus(id, status));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an appointment")
    public ResponseEntity<Void> deleteAppointment(@PathVariable UUID id) {
        appointmentService.deleteAppointment(id);
        return ResponseEntity.noContent().build();
    }
}