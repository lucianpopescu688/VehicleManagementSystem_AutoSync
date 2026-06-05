package com.AutoSync.vehicle_management_system.security.service;

import com.AutoSync.vehicle_management_system.model.User;
import com.AutoSync.vehicle_management_system.repository.UserRepository;
import com.AutoSync.vehicle_management_system.security.dto.AuthenticationResponse;
import com.AutoSync.vehicle_management_system.security.dto.LoginRequest;
import com.AutoSync.vehicle_management_system.security.dto.RegisterRequest;
import com.AutoSync.vehicle_management_system.model.Role;
import com.AutoSync.vehicle_management_system.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final com.AutoSync.vehicle_management_system.repository.ServiceShopRepository serviceShopRepository;

    public AuthenticationResponse register(RegisterRequest request) {
        if (request.getRole() == Role.ADMIN && 
            (request.getEmail() == null || !request.getEmail().endsWith("@fleetmaster.com"))) {
            throw new BadRequestException("Admin registration is restricted to @fleetmaster.com emails");
        }

        java.util.UUID finalShopId = null;

        if (request.getRole() == Role.SERVICE_SHOP_REPRESENTATIVE) {
            if (request.getNewServiceShop() != null) {
                var shop = new com.AutoSync.vehicle_management_system.model.ServiceShop();
                shop.setName(request.getNewServiceShop().getName());
                shop.setAddress(request.getNewServiceShop().getAddress());
                shop.setContactEmail(request.getNewServiceShop().getContactEmail());
                shop.setContactPhone(request.getNewServiceShop().getContactPhone());
                shop.setApproved(false);
                shop = serviceShopRepository.save(shop);
                finalShopId = shop.getId();
            } else if (request.getServiceShopId() != null) {
                if (!serviceShopRepository.existsById(request.getServiceShopId())) {
                    throw new BadRequestException("Service Shop not found");
                }
                finalShopId = request.getServiceShopId();
            } else {
                throw new BadRequestException("A service shop must be selected or created for a representative");
            }
        }

        var user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .serviceShopId(finalShopId)
                .build();

        userRepository.save(user);
        var jwtToken = jwtService.generateToken(user); // role-aware overload
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .build();
    }

    public AuthenticationResponse authenticate(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow();
        var jwtToken = jwtService.generateToken(user);
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .build();
    }
}