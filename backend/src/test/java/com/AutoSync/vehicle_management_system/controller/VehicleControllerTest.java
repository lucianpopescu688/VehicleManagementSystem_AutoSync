package com.AutoSync.vehicle_management_system.controller;

import com.AutoSync.vehicle_management_system.dto.CreateVehicleDto;
import com.AutoSync.vehicle_management_system.model.Role;
import com.AutoSync.vehicle_management_system.model.User;
import com.AutoSync.vehicle_management_system.security.service.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class VehicleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    private String bearerToken() {
        User user = User.builder()
                .email("test@example.com")
                .role(Role.STANDARD_USER)
                .build();
        return "Bearer " + jwtService.generateToken(user);
    }

    @Test
    void listVehicles_withoutAuth_returns401() throws Exception {
        mockMvc.perform(get("/v1/vehicles"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void listVehicles_withAuth_returns200() throws Exception {
        mockMvc.perform(get("/v1/vehicles")
                        .header("Authorization", bearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    void createVehicle_withInvalidDto_returns400() throws Exception {
        var dto = CreateVehicleDto.builder()
                .vin("")
                .name("")
                .model("Ford")
                .currentMileage(0)
                .build();

        mockMvc.perform(post("/v1/vehicles")
                        .header("Authorization", bearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getVehicle_notFound_returns404() throws Exception {
        mockMvc.perform(get("/v1/vehicles/00000000-0000-7000-0000-000000000000")
                        .header("Authorization", bearerToken()))
                .andExpect(status().isNotFound());
    }
}
