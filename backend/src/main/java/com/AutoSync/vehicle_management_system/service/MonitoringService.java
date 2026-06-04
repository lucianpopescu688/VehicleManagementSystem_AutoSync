package com.AutoSync.vehicle_management_system.service;

import com.AutoSync.vehicle_management_system.dto.AlertEvent;
import com.AutoSync.vehicle_management_system.model.*;
import com.AutoSync.vehicle_management_system.repository.ConsumablePartRepository;
import com.AutoSync.vehicle_management_system.repository.LegalDocumentRepository;
import com.AutoSync.vehicle_management_system.repository.MaintenanceAlertRepository;
import com.AutoSync.vehicle_management_system.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MonitoringService {

    private static final int EXPIRY_WARNING_DAYS = 7;

    private final VehicleRepository vehicleRepository;
    private final ConsumablePartRepository consumablePartRepository;
    private final LegalDocumentRepository legalDocumentRepository;
    private final MaintenanceAlertRepository maintenanceAlertRepository;
    private final NotificationService notificationService;

    @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    public void runDailyCheck() {
        log.info("Running daily monitoring check");
        checkAllVehicles();
        checkExpiringDocuments();
    }

    @Transactional
    public void checkVehicleAfterMileageUpdate(Vehicle vehicle) {
        checkWearForVehicle(vehicle);
    }

    private void checkAllVehicles() {
        vehicleRepository.findAll().forEach(this::checkWearForVehicle);
    }

    private void checkWearForVehicle(Vehicle vehicle) {
        List<ConsumablePart> parts = consumablePartRepository.findByVehicle_Id(vehicle.getId());
        for (ConsumablePart part : parts) {
            int mileageSinceReplacement = vehicle.getCurrentMileage() - part.getLastReplacedMileage();
            if (mileageSinceReplacement >= part.getLifespanKm()) {
                part.setMaintenanceRequired(true);
                consumablePartRepository.save(part);
                createWearAlert(vehicle, part, mileageSinceReplacement);
            }
        }
    }

    private void createWearAlert(Vehicle vehicle, ConsumablePart part, int mileageSinceReplacement) {
        String message = "Part '%s' on vehicle %s has exceeded its lifespan (%d km limit)."
                .formatted(part.getPartName(), vehicle.getName(), part.getLifespanKm());
        String referenceId = "wear_" + part.getId();

        if (maintenanceAlertRepository.existsByReferenceIdAndResolvedFalse(referenceId)) {
            return;
        }

        MaintenanceAlert alert = MaintenanceAlert.builder()
                .vehicle(vehicle)
                .alertType(AlertType.WEAR)
                .message(message)
                .referenceId(referenceId)
                .build();
        maintenanceAlertRepository.save(alert);

        publishAlertToOwner(vehicle, AlertType.WEAR, message);
    }

    private void checkExpiringDocuments() {
        LocalDate threshold = LocalDate.now().plusDays(EXPIRY_WARNING_DAYS);
        List<LegalDocument> expiring = legalDocumentRepository.findExpiringBefore(threshold);
        for (LegalDocument doc : expiring) {
            String message = "%s (No. %s) for vehicle %s expires on %s."
                    .formatted(doc.getDocumentType(), doc.getDocumentNumber(), doc.getVehicle().getName(), doc.getExpiryDate());
            String referenceId = "expiry_" + doc.getId();

            Vehicle vehicle = doc.getVehicle();
            if (maintenanceAlertRepository.existsByReferenceIdAndResolvedFalse(referenceId)) {
                continue;
            }

            MaintenanceAlert alert = MaintenanceAlert.builder()
                    .vehicle(vehicle)
                    .alertType(AlertType.EXPIRY)
                    .message(message)
                    .referenceId(referenceId)
                    .build();
            maintenanceAlertRepository.save(alert);

            publishAlertToOwner(vehicle, AlertType.EXPIRY, message);
        }
    }

    private void publishAlertToOwner(Vehicle vehicle, AlertType type, String message) {
        if (vehicle.getOwner() == null) return;

        User owner = vehicle.getOwner();
        AlertEvent event = AlertEvent.builder()
                .recipientEmail(owner.getEmail())
                .recipientName(owner.getFirstName() + " " + owner.getLastName())
                .alertType(type)
                .vehicleName(vehicle.getName())
                .vehiclePlate(vehicle.getVin())
                .message(message)
                .build();
        notificationService.publishAlert(event);
    }
}
