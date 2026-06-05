package com.AutoSync.vehicle_management_system.service.impl;

import com.AutoSync.vehicle_management_system.dto.AppointmentDto;
import com.AutoSync.vehicle_management_system.dto.AppointmentRequest;
import com.AutoSync.vehicle_management_system.dto.AlertEvent;
import com.AutoSync.vehicle_management_system.dto.CompleteAppointmentRequest;
import com.AutoSync.vehicle_management_system.exception.BadRequestException;
import com.AutoSync.vehicle_management_system.exception.ResourceNotFoundException;
import com.AutoSync.vehicle_management_system.mapper.AppointmentMapper;
import com.AutoSync.vehicle_management_system.model.AlertType;
import com.AutoSync.vehicle_management_system.model.Appointment;
import com.AutoSync.vehicle_management_system.model.AppointmentStatus;
import com.AutoSync.vehicle_management_system.model.ServiceShop;
import com.AutoSync.vehicle_management_system.model.User;
import com.AutoSync.vehicle_management_system.model.Vehicle;
import com.AutoSync.vehicle_management_system.repository.AppointmentRepository;
import com.AutoSync.vehicle_management_system.repository.ServiceShopRepository;
import com.AutoSync.vehicle_management_system.repository.UserRepository;
import com.AutoSync.vehicle_management_system.repository.VehicleRepository;
import com.AutoSync.vehicle_management_system.model.MaintenanceAlert;
import com.AutoSync.vehicle_management_system.model.ConsumablePart;
import com.AutoSync.vehicle_management_system.repository.ConsumablePartRepository;
import com.AutoSync.vehicle_management_system.service.AlertService;
import com.AutoSync.vehicle_management_system.service.AppointmentService;
import com.AutoSync.vehicle_management_system.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final ServiceShopRepository serviceShopRepository;
    private final AppointmentMapper appointmentMapper;
    private final AlertService alertService;
    private final ConsumablePartRepository consumablePartRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public AppointmentDto createAppointment(AppointmentRequest request, UUID requestedById) {
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));
        User requestedBy = userRepository.findById(requestedById)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        ServiceShop targetShop = serviceShopRepository.findById(request.getTargetShopId())
                .orElseThrow(() -> new ResourceNotFoundException("Service shop not found"));

        Appointment appointment = Appointment.builder()
                .vehicle(vehicle)
                .requestedBy(requestedBy)
                .targetShop(targetShop)
                .scheduledFor(request.getScheduledFor())
                .notes(request.getNotes())
                .status(AppointmentStatus.PENDING)
                .build();

        return appointmentMapper.toDto(appointmentRepository.save(appointment));
    }

    @Override
    @Transactional(readOnly = true)
    public AppointmentDto getAppointment(UUID id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
        return appointmentMapper.toDto(appointment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentDto> getAppointmentsByVehicle(UUID vehicleId) {
        return appointmentRepository.findByVehicleId(vehicleId).stream()
                .map(appointmentMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentDto> getAppointmentsByRequestedBy(UUID userId) {
        return appointmentRepository.findByRequestedById(userId).stream()
                .map(appointmentMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentDto> getAppointmentsByShop(UUID shopId) {
        return appointmentRepository.findByTargetShopId(shopId).stream()
                .map(appointmentMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AppointmentDto updateAppointmentStatus(UUID id, AppointmentStatus status) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new BadRequestException("Appointment is already completed");
        }
        if (status == AppointmentStatus.COMPLETED) {
            // Completion carries side effects (part resets, alert resolution, owner
            // notification) and requires a body — route it through /complete.
            throw new BadRequestException("Use POST /v1/appointments/{id}/complete to complete an appointment");
        }

        appointment.setStatus(status);
        return appointmentMapper.toDto(appointmentRepository.save(appointment));
    }

    @Override
    @Transactional
    public AppointmentDto completeAppointment(UUID id, CompleteAppointmentRequest request, UUID completedById) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        // Idempotency / double-completion guard.
        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new BadRequestException("Appointment is already completed");
        }

        Vehicle vehicle = appointment.getVehicle();
        int serviceMileage = request.getRecordedMileage() != null
                ? request.getRecordedMileage()
                : vehicle.getCurrentMileage();

        // ─── Resolve alerts (scoped to supplied IDs, else all open for vehicle) ──
        List<MaintenanceAlert> openAlerts = alertService.getUnresolvedForVehicle(vehicle.getId());
        if (request.getResolveAlertIds() != null && !request.getResolveAlertIds().isEmpty()) {
            Set<UUID> wanted = Set.copyOf(request.getResolveAlertIds());
            openAlerts = openAlerts.stream()
                    .filter(a -> wanted.contains(a.getId()))
                    .collect(Collectors.toList());
        }
        for (MaintenanceAlert alert : openAlerts) {
            alertService.resolve(alert.getId());
        }

        // ─── Reset parts (scoped to supplied IDs, else all needing maintenance) ──
        List<ConsumablePart> parts = consumablePartRepository.findByVehicle_Id(vehicle.getId());
        Set<UUID> wantedParts = request.getResetPartIds() != null && !request.getResetPartIds().isEmpty()
                ? Set.copyOf(request.getResetPartIds())
                : null;
        java.util.List<ConsumablePart> resetPartsList = new java.util.ArrayList<>();
        for (ConsumablePart part : parts) {
            boolean inScope = wantedParts != null ? wantedParts.contains(part.getId()) : part.isMaintenanceRequired();
            if (inScope) {
                part.setMaintenanceRequired(false);
                part.setLastReplacedMileage(serviceMileage);
                consumablePartRepository.save(part);
                resetPartsList.add(part);
            }
        }

        // ─── Capture completion data ────────────────────────────────────────────
        appointment.setStatus(AppointmentStatus.COMPLETED);
        appointment.setRecordedMileage(request.getRecordedMileage());
        appointment.setTotalCost(request.getTotalCost());
        appointment.setMechanicNotes(request.getMechanicNotes());
        appointment.setCompletedAt(LocalDateTime.now());
        appointment.setCompletedById(completedById);
        appointment.setResetParts(resetPartsList);
        Appointment saved = appointmentRepository.save(appointment);

        // ─── Notify owner ───────────────────────────────────────────────────────
        notifyOwnerOfCompletion(vehicle, saved);

        return appointmentMapper.toDto(saved);
    }

    private void notifyOwnerOfCompletion(Vehicle vehicle, Appointment appointment) {
        User owner = vehicle.getOwner();
        if (owner == null) return;

        String message = "Service for vehicle %s is complete.%s".formatted(
                vehicle.getName(),
                appointment.getMechanicNotes() != null && !appointment.getMechanicNotes().isBlank()
                        ? " Notes: " + appointment.getMechanicNotes()
                        : "");

        AlertEvent event = AlertEvent.builder()
                .recipientEmail(owner.getEmail())
                .recipientName(owner.getFirstName() + " " + owner.getLastName())
                .alertType(AlertType.SERVICE_COMPLETED)
                .vehicleName(vehicle.getName())
                .vehiclePlate(vehicle.getVin())
                .message(message)
                .build();
        notificationService.publishAlert(event);
    }

    @Override
    @Transactional
    public void deleteAppointment(UUID id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
        appointmentRepository.delete(appointment);
    }
}