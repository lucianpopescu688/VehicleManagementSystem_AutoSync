package com.AutoSync.vehicle_management_system.controller;

import com.AutoSync.vehicle_management_system.dto.CreateVehicleDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class VehicleControllerTest extends com.AutoSync.vehicle_management_system.BaseIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private com.AutoSync.vehicle_management_system.model.User createTestUser() {
        return com.AutoSync.vehicle_management_system.model.User.builder()
                .id(java.util.UUID.randomUUID())
                .email("test@example.com")
                .role(com.AutoSync.vehicle_management_system.model.Role.STANDARD_USER)
                .build();
    }

    @Test
    void listVehicles_withoutAuth_returns401() throws Exception {
        mockMvc.perform(get("/v1/vehicles"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void listVehicles_withAuth_returns200() throws Exception {
        mockMvc.perform(get("/v1/vehicles").with(user(createTestUser())))
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
                        .with(user(createTestUser()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getVehicle_notFound_returns404() throws Exception {
        mockMvc.perform(get("/v1/vehicles/00000000-0000-7000-0000-000000000000")
                        .with(user(createTestUser())))
                .andExpect(status().isNotFound());
    }
}
