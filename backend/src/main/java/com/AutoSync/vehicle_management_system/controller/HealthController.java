package com.AutoSync.vehicle_management_system.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    @GetMapping("/health")
    public ResponseEntity<HealthStatus> health() {
        return ResponseEntity.ok(new HealthStatus("UP", "Vehicle Management System is running"));
    }

    @GetMapping("/")
    public ResponseEntity<HealthStatus> root() {
        return ResponseEntity.ok(new HealthStatus("UP", "Vehicle Management System is running"));
    }

    public static class HealthStatus {
        public String status;
        public String message;

        public HealthStatus(String status, String message) {
            this.status = status;
            this.message = message;
        }

        public String getStatus() {
            return status;
        }

        public String getMessage() {
            return message;
        }
    }
}

