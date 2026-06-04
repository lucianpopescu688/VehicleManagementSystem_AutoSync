package com.AutoSync.vehicle_management_system.service.impl;

import com.AutoSync.vehicle_management_system.dto.AppointmentDto;
import com.AutoSync.vehicle_management_system.dto.AppointmentRequest;
import com.AutoSync.vehicle_management_system.exception.ResourceNotFoundException;
import com.AutoSync.vehicle_management_system.mapper.AppointmentMapper;
import com.AutoSync.vehicle_management_system.model.Appointment;
import com.AutoSync.vehicle_management_system.model.AppointmentStatus;
import com.AutoSync.vehicle_management_system.model.ServiceShop;
import com.AutoSync.vehicle_management_system.model.User;
import com.AutoSync.vehicle_management_system.model.Vehicle;
import com.AutoSync.vehicle_management_system.repository.AppointmentRepository;
import com.AutoSync.vehicle_management_system.repository.ServiceShopRepository;
import com.AutoSync.vehicle_management_system.repository.UserRepository;
import com.AutoSync.vehicle_management_system.repository.VehicleRepository;
import com.AutoSync.vehicle_management_system.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
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
        appointment.setStatus(status);
        return appointmentMapper.toDto(appointmentRepository.save(appointment));
    }

    @Override
    @Transactional
    public void deleteAppointment(UUID id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
        appointmentRepository.delete(appointment);
    }
}