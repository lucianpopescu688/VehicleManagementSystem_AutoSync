package com.AutoSync.vehicle_management_system.controller;

import com.AutoSync.vehicle_management_system.dto.LogMileageRequest;
import com.AutoSync.vehicle_management_system.dto.MileageLogDto;
import com.AutoSync.vehicle_management_system.mapper.MileageLogMapper;
import com.AutoSync.vehicle_management_system.service.MileageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/v1/mileage")
@RequiredArgsConstructor
public class MileageController {

    private final MileageService mileageService;
    private final MileageLogMapper mileageLogMapper;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'STANDARD_USER', 'FLEET_DRIVER') and @vehicleAccess.canAccessVehicle(#request.vehicleId)")
    public ResponseEntity<MileageLogDto> log(@RequestBody @Valid LogMileageRequest request) {
        return ResponseEntity.ok(mileageLogMapper.toDto(mileageService.logMileage(request)));
    }

    @GetMapping("/vehicles/{vehicleId}/history")
    @PreAuthorize("@vehicleAccess.canAccessVehicle(#vehicleId)")
    public ResponseEntity<Page<MileageLogDto>> history(
            @PathVariable UUID vehicleId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(mileageService.getHistory(vehicleId, pageable).map(mileageLogMapper::toDto));
    }
}
