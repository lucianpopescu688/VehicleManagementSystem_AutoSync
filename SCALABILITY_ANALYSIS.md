# Codebase Scalability Analysis & Recommendations

> Generated: 2026-05-19  
> Scope: Iteration 1.5 — preparing for Iterations 2 & 3

---

## Table of Contents

1. [Backend Architecture](#backend-architecture--structural-issues)
2. [Security & Authentication](#security--authentication--scalability-gaps)
3. [Database & ORM](#database--orm--structural-issues)
4. [Missing Infrastructure for Iteration 2 & 3](#missing-infrastructure-for-iteration-2--3)
5. [Testing Gaps](#testing---gaps-before-iteration-2)
6. [Summary of Priority Actions](#summary-of-priority-actions)

---

## Backend Architecture — Structural Issues

### A. Empty Shell Entities Need Proper Relationships ⚠️ P1

`Appointment`, `Document`, and `ServiceShop` are empty classes. When you implement Iteration 2 & 3, these need proper JPA mappings now to avoid refactoring later:

```java
@Entity
@Table(name = "appointments")
public class Appointment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by_id", nullable = false)
    private User requestedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_shop_id", nullable = false)
    private ServiceShop targetShop;

    // ... status enum, dates, notes
}
```

---

## Security & Authentication — Scalability Gaps

### A. No Rate Limiting on Auth Endpoints ⚠️ P2

**Problem:** `/api/v1/auth/register` and `/authenticate` have no rate limiting. This is a brute-force vector that will become more critical as the app grows.

**Fix:** Add Spring Security rate limiting or use a simple counter-based approach:

```java
@Bean
public RateLimiterConfiguration rateLimiterConfig() {
    return new RateLimiterConfiguration(
        RateLimitRule.forPath("/api/v1/auth/**").limitToRequestsPerMinute(10)
    );
}
```

---

### B. No Email Verification on Registration ⚠️ P2

**Problem:** Anyone can register with any role. For Iteration 2+ where roles matter (FLEET_MANAGER, SERVICE_SHOP_REPRESENTATIVE), this needs tightening.

---

## Database & ORM — Structural Issues

### A. No Soft Delete Support ⚠️ P3

Everything uses hard deletes (`ON DELETE CASCADE`). For a fleet management system, you need audit trails:

```java
@Column(name = "deleted_at")
private LocalDateTime deletedAt;

// Then use @Query with WHERE deleted_at IS NULL in repositories
```

---

### B. Missing Composite Indexes for Iteration 2 Queries ⚠️ P2

When you add mileage tracking and consumables, you'll need indexes like:

- `(vehicle_id, date)` on maintenance_records — ✅ already done
- `(status, scheduled_for)` on appointments — ✅ already done
- ❌ Missing: `(owner_id, assigned_driver_id)` composite index for RBAC queries

---

## Missing Infrastructure for Iteration 2 & 3

### A. No Notification Service Abstraction Layer ⚠️ P2

For Iteration 2, you need a pluggable notification system (email now, SMS later):

```java
public interface NotificationChannel {
    void send(String recipient, String subject, String body);
}

@Component("emailNotification")
public class EmailNotificationService implements NotificationChannel { ... }

// Future: @Component("smsNotification") for Iteration 3+
```

---

## Testing — Gaps Before Iteration 2

### A. Only One Boilerplate Test ⚠️ P3

The only test is `contextLoads()`. For Iteration 2's complex wear-and-tear logic, you need:

- **Unit tests** for service layer (threshold calculations)
- **Integration tests** with `@SpringBootTest` + Testcontainers
- **Controller tests** with `@WebMvcTest` + MockMvc

```java
// Example test structure to add now:
@SpringBootTest
@Testcontainers // For real PostgreSQL in tests
class VehicleServiceIntegrationTest { ... }

@WebMvcTest(VehicleController.class)
class VehicleControllerTest { ... }
```

---

## Summary of Priority Actions

| Priority | Area       | Action                                              | Impact on Future Iterations          |
|----------|------------|-----------------------------------------------------|--------------------------------------|
| **P1**   | Backend    | Flesh out Appointment/ServiceShop with proper JPA mappings | Foundation for Iteration 2 & 3 |
| **P2**   | Backend    | Add Auth Rate Limiting and Email Verification       | Mitigate brute force attacks     |
| **P2**   | Database   | Add `(owner_id, assigned_driver_id)` composite index | Needed for RBAC performance |
| **P2**   | Infra      | Abstract NotificationService into NotificationChannel | Prepare for SMS notifications |
| **P3**   | Testing    | Add Testcontainers + MockMvc test scaffolding       | Required before complex logic in Iteration 2 |
| **P3**   | Database   | Add soft delete support (`deleted_at`)              | Audit trail requirement for fleet management |
