package com.AutoSync.vehicle_management_system;

import com.AutoSync.vehicle_management_system.dto.CompleteAppointmentRequest;
import com.AutoSync.vehicle_management_system.model.*;
import com.AutoSync.vehicle_management_system.repository.*;
import com.AutoSync.vehicle_management_system.service.AppointmentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

public class AppointmentCompletionTest extends BaseIntegrationTest {

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ServiceShopRepository serviceShopRepository;

    @Autowired
    private MaintenanceAlertRepository alertRepository;

    @Autowired
    private ConsumablePartRepository partRepository;

    @Test
    void testCompleteAppointment_Success() {
        // 1. Setup Test Data
        User owner = userRepository.save(User.builder()
                .email("owner_comp@example.com")
                .passwordHash("hash")
                .firstName("Owner")
                .lastName("Comp")
                .role(Role.STANDARD_USER)
                .build());

        User mechanic = userRepository.save(User.builder()
                .email("mech_comp@example.com")
                .passwordHash("hash")
                .firstName("Mech")
                .lastName("Comp")
                .role(Role.SERVICE_SHOP_REPRESENTATIVE)
                .build());

        ServiceShop shop = serviceShopRepository.save(ServiceShop.builder()
                .name("Comp Shop")
                .address("123 Comp St")
                .email("shop_comp@example.com")
                .build());

        Vehicle vehicle = vehicleRepository.save(Vehicle.builder()
                .vin("COMP1234567890123")
                .name("Comp Car")
                .model("Model C")
                .year(2025)
                .currentMileage(10000)
                .owner(owner)
                .build());

        ConsumablePart part = partRepository.save(ConsumablePart.builder()
                .vehicle(vehicle)
                .name("Oil Filter")
                .partNumber("OF-123")
                .expectedLifespanMileage(5000)
                .lastReplacedMileage(0)
                .maintenanceRequired(true)
                .build());

        MaintenanceAlert alert = alertRepository.save(MaintenanceAlert.builder()
                .vehicle(vehicle)
                .part(part)
                .type(AlertType.MAINTENANCE_REQUIRED)
                .severity(AlertSeverity.HIGH)
                .status(AlertStatus.UNRESOLVED)
                .message("Needs Oil Filter")
                .build());

        Appointment appointment = appointmentRepository.save(Appointment.builder()
                .vehicle(vehicle)
                .requestedBy(owner)
                .targetShop(shop)
                .scheduledFor(LocalDateTime.now().plusDays(1))
                .status(AppointmentStatus.PENDING)
                .notes("Oil change needed")
                .build());

        // 2. Execute Complete Appointment
        CompleteAppointmentRequest request = new CompleteAppointmentRequest();
        request.setRecordedMileage(10500);
        request.setTotalCost(new BigDecimal("50.00"));
        request.setMechanicNotes("Fixed oil filter");
        request.setResolveAlertIds(List.of(alert.getId()));
        request.setResetPartIds(List.of(part.getId()));

        appointmentService.completeAppointment(appointment.getId(), request, mechanic.getId());

        // 3. Verify Result
        Appointment completed = appointmentRepository.findById(appointment.getId()).orElseThrow();
        assertThat(completed.getStatus()).isEqualTo(AppointmentStatus.COMPLETED);
        assertThat(completed.getRecordedMileage()).isEqualTo(10500);
        assertThat(completed.getTotalCost()).isEqualByComparingTo("50.00");
        assertThat(completed.getMechanicNotes()).isEqualTo("Fixed oil filter");
        assertThat(completed.getCompletedById()).isEqualTo(mechanic.getId());
        assertThat(completed.getResetParts()).hasSize(1);
        assertThat(completed.getResetParts().get(0).getId()).isEqualTo(part.getId());

        ConsumablePart updatedPart = partRepository.findById(part.getId()).orElseThrow();
        assertThat(updatedPart.isMaintenanceRequired()).isFalse();
        assertThat(updatedPart.getLastReplacedMileage()).isEqualTo(10500);

        MaintenanceAlert updatedAlert = alertRepository.findById(alert.getId()).orElseThrow();
        assertThat(updatedAlert.getStatus()).isEqualTo(AlertStatus.RESOLVED);
        assertThat(updatedAlert.getResolvedAt()).isNotNull();
    }
}
