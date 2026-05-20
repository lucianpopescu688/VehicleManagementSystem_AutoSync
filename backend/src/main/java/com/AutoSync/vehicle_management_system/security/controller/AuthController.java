package com.AutoSync.vehicle_management_system.security.controller;

import com.AutoSync.vehicle_management_system.security.dto.AuthenticationResponse;
import com.AutoSync.vehicle_management_system.security.dto.LoginRequest;
import com.AutoSync.vehicle_management_system.security.dto.RegisterRequest;
import com.AutoSync.vehicle_management_system.security.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthenticationResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/authenticate")
    public ResponseEntity<AuthenticationResponse> authenticate(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.authenticate(request));
    }
}