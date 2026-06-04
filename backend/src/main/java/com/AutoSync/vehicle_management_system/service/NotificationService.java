package com.AutoSync.vehicle_management_system.service;

import com.AutoSync.vehicle_management_system.config.RabbitMQConfig;
import com.AutoSync.vehicle_management_system.dto.AlertEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final RabbitTemplate rabbitTemplate;

    public void publishAlert(AlertEvent event) {
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.ALERTS_EXCHANGE,
                RabbitMQConfig.ALERTS_ROUTING_KEY,
                event
        );
    }
}
