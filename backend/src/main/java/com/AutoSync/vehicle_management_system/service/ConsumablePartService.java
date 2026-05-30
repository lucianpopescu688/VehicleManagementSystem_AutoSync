package com.AutoSync.vehicle_management_system.service;

import com.AutoSync.vehicle_management_system.dto.ConsumablePartRequest;
import com.AutoSync.vehicle_management_system.model.ConsumablePart;

import java.util.List;
import java.util.UUID;

public interface ConsumablePartService {
    ConsumablePart create(ConsumablePartRequest request);
    ConsumablePart update(UUID id, ConsumablePartRequest request);
    void delete(UUID id);
    List<ConsumablePart> listByVehicle(UUID vehicleId);
}
