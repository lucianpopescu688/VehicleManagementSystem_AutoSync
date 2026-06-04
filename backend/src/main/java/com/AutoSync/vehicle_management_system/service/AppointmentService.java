package com.AutoSync.vehicle_management_system.service;

import com.AutoSync.vehicle_management_system.dto.AppointmentDto;
import com.AutoSync.vehicle_management_system.dto.AppointmentRequest;
import com.AutoSync.vehicle_management_system.model.AppointmentStatus;

import java.util.List;
import java.util.UUID;

public interface AppointmentService {
    AppointmentDto createAppointment(AppointmentRequest request, UUID requestedById);
    AppointmentDto getAppointment(UUID id);
    List<AppointmentDto> getAppointmentsByVehicle(UUID vehicleId);
    List<AppointmentDto> getAppointmentsByRequestedBy(UUID userId);
    List<AppointmentDto> getAppointmentsByShop(UUID shopId);
    AppointmentDto updateAppointmentStatus(UUID id, AppointmentStatus status);
    void deleteAppointment(UUID id);
}