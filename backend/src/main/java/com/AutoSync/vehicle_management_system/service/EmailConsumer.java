package com.AutoSync.vehicle_management_system.service;

import com.AutoSync.vehicle_management_system.config.RabbitMQConfig;
import com.AutoSync.vehicle_management_system.dto.AlertEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class EmailConsumer {

    private final JavaMailSender mailSender;

    @RabbitListener(queues = RabbitMQConfig.ALERTS_QUEUE)
    public void handleAlert(AlertEvent event) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(event.getRecipientEmail());
            message.setFrom("noreply@autosync.local");
            message.setSubject(buildSubject(event));
            message.setText(buildBody(event));
            mailSender.send(message);
            log.info("Alert email sent to {} for vehicle {}", event.getRecipientEmail(), event.getVehicleName());
        } catch (Exception e) {
            log.error("Failed to send alert email to {}: {}", event.getRecipientEmail(), e.getMessage());
        }
    }

    private String buildSubject(AlertEvent event) {
        return switch (event.getAlertType()) {
            case WEAR -> "[AutoSync] Maintenance Required — " + event.getVehicleName();
            case EXPIRY -> "[AutoSync] Document Expiring Soon — " + event.getVehicleName();
        };
    }

    private String buildBody(AlertEvent event) {
        return """
                Hello %s,

                %s

                Vehicle: %s
                Please log in to AutoSync to take action.

                — AutoSync System
                """.formatted(event.getRecipientName(), event.getMessage(), event.getVehicleName());
    }
}
