package com.AutoSync.vehicle_management_system.controller;

import com.AutoSync.vehicle_management_system.model.Role;
import com.AutoSync.vehicle_management_system.security.dto.LoginRequest;
import com.AutoSync.vehicle_management_system.security.dto.RegisterRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void register_returnsToken() throws Exception {
        var request = RegisterRequest.builder()
                .firstName("Test")
                .lastName("User")
                .email("test_" + System.currentTimeMillis() + "@example.com")
                .password("password123")
                .role(Role.STANDARD_USER)
                .build();

        mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void authenticate_withBadCredentials_returns403() throws Exception {
        var request = new LoginRequest("nonexistent@example.com", "wrongpassword");

        mockMvc.perform(post("/v1/auth/authenticate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void register_thenAuthenticate_returnsToken() throws Exception {
        String email = "auth_test_" + System.currentTimeMillis() + "@example.com";
        String password = "securePass99";

        var reg = RegisterRequest.builder()
                .firstName("Auth")
                .lastName("Test")
                .email(email)
                .password(password)
                .role(Role.STANDARD_USER)
                .build();

        mockMvc.perform(post("/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isOk());

        var login = new LoginRequest(email, password);

        mockMvc.perform(post("/v1/auth/authenticate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
    }
}
