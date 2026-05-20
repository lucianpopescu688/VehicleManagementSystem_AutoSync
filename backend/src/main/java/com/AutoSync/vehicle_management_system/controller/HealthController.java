package com.AutoSync.vehicle_management_system.controller;

import com.AutoSync.vehicle_management_system.dto.HealthResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    @GetMapping("/health")
    public ResponseEntity<HealthResponse> health() {
        return ResponseEntity.ok(new HealthResponse("UP", "Vehicle Management System is running"));
    }

    @GetMapping("/")
    public ResponseEntity<HealthResponse> root() {
        return ResponseEntity.ok(new HealthResponse("UP", "Vehicle Management System is running"));
    }
}
