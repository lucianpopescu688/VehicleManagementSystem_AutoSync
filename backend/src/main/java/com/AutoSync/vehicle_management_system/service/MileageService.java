package com.AutoSync.vehicle_management_system.service;

import com.AutoSync.vehicle_management_system.dto.LogMileageRequest;
import com.AutoSync.vehicle_management_system.model.MileageLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface MileageService {
    MileageLog logMileage(LogMileageRequest request);
    Page<MileageLog> getHistory(UUID vehicleId, Pageable pageable);
}
