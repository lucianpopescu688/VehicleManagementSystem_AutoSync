package com.AutoSync.vehicle_management_system.repository;

import com.AutoSync.vehicle_management_system.model.LegalDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface LegalDocumentRepository extends JpaRepository<LegalDocument, UUID> {
    List<LegalDocument> findByVehicle_Id(UUID vehicleId);

    @Query("SELECT d FROM LegalDocument d WHERE d.expiryDate <= :threshold AND d.expiryDate >= CURRENT_DATE")
    List<LegalDocument> findExpiringBefore(@Param("threshold") LocalDate threshold);
}
