package com.AutoSync.vehicle_management_system.controller;

import com.AutoSync.vehicle_management_system.BaseIntegrationTest;
import com.AutoSync.vehicle_management_system.dto.AppointmentRequest;
import com.AutoSync.vehicle_management_system.model.Role;
import com.AutoSync.vehicle_management_system.model.User;
import com.AutoSync.vehicle_management_system.model.Vehicle;
import com.AutoSync.vehicle_management_system.repository.UserRepository;
import com.AutoSync.vehicle_management_system.repository.VehicleRepository;
import com.AutoSync.vehicle_management_system.repository.ServiceShopRepository;
import com.AutoSync.vehicle_management_system.model.ServiceShop;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AppointmentControllerTest extends BaseIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private ServiceShopRepository serviceShopRepository;

    @Test
    void createAppointment_withoutAuth_returns401() throws Exception {
        mockMvc.perform(post("/v1/appointments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createAppointment_managerCreates_returns201() throws Exception {
        User manager = userRepository.save(User.builder()
                .email("manager_appt@example.com")
                .passwordHash("hash")
                .role(Role.FLEET_MANAGER)
                .build());

        Vehicle vehicle = vehicleRepository.save(Vehicle.builder()
                .vin("APP1234567890123")
                .name("App Car")
                .model("Model")
                .year(2025)
                .currentMileage(100)
                .owner(manager) // Manager owns it -> canAccessVehicle is true
                .build());

        ServiceShop shop = serviceShopRepository.save(ServiceShop.builder()
                .name("Shop")
                .address("123 St")
                .email("shop_appt@example.com")
                .build());

        AppointmentRequest request = new AppointmentRequest();
        request.setVehicleId(vehicle.getId());
        request.setTargetShopId(shop.getId());
        request.setScheduledFor(LocalDateTime.now().plusDays(2));
        request.setNotes("Test appt");

        mockMvc.perform(post("/v1/appointments")
                        .with(user(manager))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    @Test
    void completeAppointment_wrongShopRep_returns403() throws Exception {
        // Just testing RBAC denies cross-tenant access.
        // We will create a fake rep and a fake appointment ID.
        // Actually, @vehicleAccess.canCompleteAppointment(#id) checks the db for the appointment.
        // If appointment doesn't exist, it returns true by default (orElse(true)), 
        // BUT wait, in VehicleOwnershipService:
        // return appointmentRepository.findById(appointmentId).map(Appointment::getTargetShop).map(shop -> Objects.equals(shop.getId(), user.getServiceShopId())).orElse(true);
        // Oh, if it returns true, then the endpoint will throw 404 Not Found in the service layer.
        // To properly test 403, the appointment MUST exist and belong to a DIFFERENT shop.
        
        ServiceShop shop1 = serviceShopRepository.save(ServiceShop.builder()
                .name("Shop 1")
                .address("123 St")
                .email("shop1@example.com")
                .build());

        ServiceShop shop2 = serviceShopRepository.save(ServiceShop.builder()
                .name("Shop 2")
                .address("123 St")
                .email("shop2@example.com")
                .build());

        User manager = userRepository.save(User.builder()
                .email("mgr_cross@example.com")
                .passwordHash("h")
                .role(Role.FLEET_MANAGER)
                .build());

        User rep2 = userRepository.save(User.builder()
                .email("rep2@example.com")
                .passwordHash("h")
                .role(Role.SERVICE_SHOP_REPRESENTATIVE)
                .serviceShopId(shop2.getId())
                .build());

        Vehicle vehicle = vehicleRepository.save(Vehicle.builder()
                .vin("CROSS123456789012")
                .name("Cross")
                .model("Model")
                .year(2025)
                .currentMileage(100)
                .owner(manager)
                .build());

        // Create appointment belonging to shop1 directly
        // We will just use the REST API as manager to create it
        AppointmentRequest request = new AppointmentRequest();
        request.setVehicleId(vehicle.getId());
        request.setTargetShopId(shop1.getId());
        request.setScheduledFor(LocalDateTime.now().plusDays(2));
        
        String response = mockMvc.perform(post("/v1/appointments")
                        .with(user(manager))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
                
        String appointmentId = objectMapper.readTree(response).get("id").asText();

        // Now rep2 tries to complete it (should get 403 because it belongs to shop1)
        mockMvc.perform(post("/v1/appointments/" + appointmentId + "/complete")
                        .with(user(rep2))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }
}
