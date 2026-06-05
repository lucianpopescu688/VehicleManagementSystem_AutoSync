# Iteration 3 — Follow-up (problems from `c6fbb51` "Last Chance")

## Context

`c6fbb51` shipped the headline rule (completing an appointment clears alerts +
resets parts) plus RBAC and shop-linking — but folded completion into the existing
`PATCH /{id}/status` endpoint and skipped the spec'd data model, guards, and tests
from [TODO.md](TODO.md). This file tracks the resulting problems.

---

## Part A — Completion logic is unsafe / coarse

Lives in `AppointmentServiceImpl.updateAppointmentStatus` (the `status == COMPLETED`
block), not a dedicated endpoint.

### 🔴 P1. No double-completion guard
Re-sending `PATCH /{id}/status?status=COMPLETED` re-runs the whole side-effect block
every time — re-resets parts to current mileage, re-resolves alerts. No check that
status is already `COMPLETED`.
- Guard at top of the block: if `appointment.getStatus() == COMPLETED`, no-op or 409.

### 🔴 P2. Completion is all-or-nothing — no scoping
Resolves **every** unresolved alert on the vehicle and resets **every** part with
`maintenanceRequired`, regardless of what the shop actually serviced.
- TODO.md spec wanted caller-supplied `resetPartIds` / `resolveAlertIds`. Either
  honor a scoped request body or document/accept the broad behavior as intentional.

### 🔴 P3. No completion data captured
Spec wanted `recordedMileage`, `totalCost`, `mechanicNotes`, `completedAt` + a
`appointment_reset_parts` audit join. None exist. Reset uses
`vehicle.getCurrentMileage()` as a stand-in for actual service mileage.
- Decide: implement the `V7__appointment_completion.sql` columns + join table, or
  drop from scope and update TODO.md.

### 🔴 P4. Owner not notified
No `SERVICE_COMPLETED` alert type, no email on completion. Owner gets nothing when
their vehicle's service finishes.

### 🟡 P5. Side effects on wrong endpoint
Heavy, irreversible business logic hangs off a generic status setter. A
`POST /{id}/complete` endpoint (per TODO.md T2) separates concerns and lets RBAC /
validation target completion specifically.

---

## Part B — RBAC gaps from the new shape

### 🔴 P6. `GET /shop/my-appointments` — no ADMIN path
Endpoint is `hasRole('SERVICE_SHOP_REPRESENTATIVE')` only and derives shop from the
caller's `serviceShopId`. Admins can no longer view a shop's queue (old
`/shop/{shopId}` was removed). Decide whether ADMIN needs shop-scoped read.

### 🔴 P7. Status update not ownership-scoped
`PATCH /{id}/status` allows any `SERVICE_SHOP_REPRESENTATIVE` — not just the rep
whose `serviceShopId` matches the appointment's `targetShopId`. A rep from shop X can
complete/cancel shop Y's appointments (and trigger P1–P4 side effects on a vehicle
they don't service).
- Add ownership check: rep's `serviceShopId == appointment.targetShopId`.

### 🟡 P8. `service_shop_id` set on registration?
`User.serviceShopId` FK added, but confirm `AuthService` / `RegisterRequest`
populates it for `SERVICE_SHOP_REPRESENTATIVE` signups — otherwise `my-appointments`
always throws `BadRequestException` and reps can never see their queue.

---

## Part C — Tests missing (TODO.md T4 still open)

### 🔴 P9. No `AppointmentCompletionTest`
Integration test the brief requires: seed vehicle + overdue part + `WEAR` alert +
appointment → complete → assert alert `resolved`, part reset, status `COMPLETED`.
Must also now cover P1 (idempotency) and P7 (cross-shop denial).

### 🔴 P10. No `AppointmentControllerTest`
unauth → 401; valid create → 201; cross-tenant create/read → 403; non-rep status
update → 403.

---

## Part D — Frontend drift

### 🟡 P11. Routes added but unscoped to TODO
`analytics.tsx` + `appointments.tsx` landed (not the spec'd `service.tsx` hub).
Confirm `appointments.tsx` consumes the renamed `/shop/my-appointments` and there is
still a rep-facing queue + completion UI. Regenerate client if a `/complete`
endpoint is added (P5).
