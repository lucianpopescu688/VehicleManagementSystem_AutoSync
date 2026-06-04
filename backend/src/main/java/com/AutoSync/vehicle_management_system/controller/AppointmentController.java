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

    @GetMapping("/shop/{shopId}")
    @Operation(summary = "Get appointments for a service shop")
    public ResponseEntity<List<AppointmentDto>> getAppointmentsByShop(@PathVariable UUID shopId) {
        return ResponseEntity.ok(appointmentService.getAppointmentsByShop(shopId));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update appointment status")
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