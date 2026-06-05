# FINALPLAN — Full Project Audit & Fix List

> **Generated:** 2026-06-05
> **Scope:** Complete codebase audit of backend, frontend, infrastructure, and outstanding TODO2 items
> **Updated:** 2026-06-05 — MVP pass implemented (no security/RBAC, no CORS, containerized). See Implementation Status below.

---

## Implementation Status (2026-06-05 MVP pass)

> [!NOTE]
> Goal this pass: working containerized MVP. Decisions: **keep JWT, skip RBAC ownership-scoping**; **no CORS** (Vite dev proxy makes frontend same-origin); **core MVP scope only**.

### ✅ Done & verified end-to-end
- **Completion flow (Part 1):** `POST /v1/appointments/{id}/complete` + `CompleteAppointmentRequest` DTO; double-completion guard (→ 400); scoped part-reset / alert-resolution (falls back to all when no IDs given); completion data captured (`recordedMileage`, `totalCost`, `mechanicNotes`, `completedAt`, `completedById`). Side-effects removed from `PATCH /status`.
- **DB migration (Part 4.1):** `V9__appointment_completion.sql` applied in container (Flyway v9).
- **Notifications (Part 5):** `AlertType.SERVICE_COMPLETED`, `EmailConsumer` case, owner email published on completion (verified in MailHog).
- **Scheduling (6.1):** `@EnableScheduling` added — daily wear/expiry cron now fires.
- **Frontend build blockers (Part 7):** `appointments.tsx` types/auth-store fixed; analytics pie-chart key bug fixed.
- **Frontend service hub (8.1) + Service tab (8.2):** rewritten on generated orval hooks; completion modal; vehicle-detail Service/history tab.
- **Shared components (8.5) + Toast (8.3):** `Button, Card, PageHeader, Field, Modal, Spinner, EmptyState, StatCard, ProgressBar, ToastProvider/useToast`.
- **Code quality:** `serialVersionUID` on `AlertEvent` (6.6), dead `DisabledNavItem` removed (9.8).
- **Infra:** dropped deprecated `version:` key (10.3); orval regenerated against live container.

E2E verified: WEAR alert trips → complete → part reset to recorded mileage, alert resolved, status COMPLETED, owner email sent, double-complete → 400, unauth → 401.

### ⏭️ Intentionally skipped (per MVP decision)
- **All RBAC / ownership-scoping (Part 2, §2.1–2.12):** kept JWT auth + existing role checks only. `/complete` & `/status` require `ADMIN`/`SERVICE_SHOP_REPRESENTATIVE` role but **no shop-ownership check** — any rep can act on any shop's appointment.
- **CORS (6.2):** not implemented — not needed with Vite dev proxy.
- **Backend tests (Part 3):** not written.
- **UI/UX & a11y polish (Part 9, most of Part 8.4/8.6):** search bar, card grid, decorative buttons, aria-labels, etc.
- **Audit join table (4.2), status-transition state machine (2.8/6.7), @Valid on auth (2.9/2.10), V1 role residue (4.3), dead `MaintenanceRecordRepository` (6.3), dup `@CreatedDate` (6.4), `deleteVehicle` no-op (6.5).**

### ⚠️ New finding — Real-time / live updates (see Part 11)
Cross-user interaction is **not push-based**. RabbitMQ drives email, not browser push. ✅ **Mitigated 2026-06-05:** 10 s polling added to appointment queries (rep sees new requests, owner sees completion within ~10 s). True push (SSE/WebSocket) still outstanding — see Part 11.4.

---

## Executive Summary

| Area | Critical (P0) | High (P1) | Medium (P2) | Low (P3) | Total |
|------|:---:|:---:|:---:|:---:|:---:|
| Backend — Completion Logic | 5 | — | — | — | 5 |
| Backend — RBAC / Security | 7 | 3 | 2 | — | 12 |
| Backend — Tests | — | 2 | — | — | 2 |
| Backend — DB Migrations | — | 3 | — | — | 3 |
| Backend — Notifications | — | 3 | — | — | 3 |
| Backend — Code Quality | — | 2 | 5 | 3 | 10 |
| Frontend — Build Blockers | 3 | — | — | — | 3 |
| Frontend — Missing Features | — | 5 | 3 | — | 8 |
| Frontend — UI/UX & A11y | — | — | 5 | 8 | 13 |
| Infrastructure | — | 1 | 2 | 2 | 5 |
| **Total** | **15** | **19** | **17** | **13** | **64** |

---

## Part 1 — Backend: Appointment Completion Logic (P0)

> [!CAUTION]
> These 5 issues make the core iteration-3 deliverable — "completing a service auto-clears alerts and resets parts" — **unsafe and incomplete**. All originate from TODO2 P1–P5.

### 1.1 🔴 No double-completion guard
**File:** `backend/…/service/impl/AppointmentServiceImpl.java` ≈ line 97
**Problem:** `updateAppointmentStatus()` does NOT check if status is already `COMPLETED`. Re-sending `PATCH /{id}/status?status=COMPLETED` re-runs every side-effect: re-resolves all alerts, re-resets all parts.
**Fix:** Guard at top of the COMPLETED block:
```java
if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
    throw new BadRequestException("Appointment is already completed");
}
```
*Source: TODO2 P1*

---

### 1.2 🔴 No scoping — resets ALL parts & ALL alerts
**File:** `AppointmentServiceImpl.java` ≈ lines 106-119
**Problem:** On completion, resolves **every** unresolved alert on the vehicle and resets **every** part with `maintenanceRequired=true`, regardless of what was actually serviced. If a vehicle has two appointments for different issues, completing one wipes everything.
**Fix:** Accept caller-supplied `resetPartIds` / `resolveAlertIds` in a request body (requires the new `/complete` endpoint — see §1.5).
*Source: TODO2 P2*

---

### 1.3 🔴 No completion data captured
**File:** `model/Appointment.java` lines 23-66
**Problem:** Entity only has: `id`, `vehicle`, `requestedBy`, `targetShop`, `requestedAt`, `scheduledFor`, `status`, `notes`, `createdAt`, `updatedAt`. No `recordedMileage`, `totalCost`, `mechanicNotes`, `completedAt`. Reset uses `vehicle.getCurrentMileage()` as a stand-in for actual service mileage.
**Fix:** Add completion columns to entity + new migration `V9__appointment_completion.sql`.
*Source: TODO2 P3, TODO T1*

---

### 1.4 🔴 Owner not notified on completion
**File:** `AppointmentServiceImpl.java` — the COMPLETED block
**Problem:** No `SERVICE_COMPLETED` alert type, no email on completion. `NotificationService` is never called. Owner gets nothing when their vehicle's service finishes.
**Fix:** Add `SERVICE_COMPLETED` to `AlertType.java`, add case to `EmailConsumer.buildSubject`/`buildBody`, call `NotificationService.publishAlert()` on completion.
*Source: TODO2 P4*

---

### 1.5 🔴 Side effects on wrong endpoint
**File:** `AppointmentController.java` lines 65-72
**Problem:** Heavy, irreversible completion logic hangs off a generic `PATCH /{id}/status?status=...` (which only accepts an enum param — no request body for mileage/cost/notes). A dedicated endpoint separates concerns and enables scoped data.
**Fix:** Add `POST /v1/appointments/{id}/complete` with `CompleteAppointmentRequest` DTO.
*Source: TODO2 P5, TODO T2*

---

## Part 2 — Backend: RBAC & Security (P0/P1)

> [!CAUTION]
> Multiple endpoints have no authorization at all. A rep from Shop X can modify Shop Y's appointments.

### 2.1 🔴 P0 — Status update not ownership-scoped
**File:** `AppointmentController.java` line 65-72
**Problem:** `PATCH /{id}/status` allows **any** `SERVICE_SHOP_REPRESENTATIVE` — not just the rep whose `serviceShopId` matches the appointment's `targetShopId`. A rep from Shop X can complete/cancel Shop Y's appointments.
**Fix:** Add ownership check: `rep.serviceShopId == appointment.targetShop.id`.
*Source: TODO2 P7*

### 2.2 🔴 P0 — `GET /{id}` — No @PreAuthorize
**File:** `AppointmentController.java` lines 37-41
**Problem:** Any authenticated user can view ANY appointment by ID.

### 2.3 🔴 P0 — `GET /vehicle/{vehicleId}` — No @PreAuthorize
**File:** `AppointmentController.java` lines 43-47
**Problem:** Any authenticated user can list appointments for ANY vehicle.

### 2.4 🔴 P0 — `DELETE /{id}` — No @PreAuthorize
**File:** `AppointmentController.java` lines 74-79
**Problem:** Any authenticated user can delete ANY appointment.

### 2.5 🔴 P0 — `ServiceShopController PUT /{id}` — No RBAC
**File:** `ServiceShopController.java` lines 50-54
**Problem:** Any authenticated user can update any shop's details. Should require ADMIN or the shop's own representative.

### 2.6 🔴 P0 — `GET /shop/my-appointments` — No ADMIN path
**File:** `AppointmentController.java` line 57
**Problem:** `hasRole('SERVICE_SHOP_REPRESENTATIVE')` only. Admins can no longer view a shop's queue.
**Fix:** `hasAnyRole('ADMIN', 'SERVICE_SHOP_REPRESENTATIVE')` + optional `shopId` param for admin.
*Source: TODO2 P6*

### 2.7 🔴 P0 — `VehicleOwnershipService` missing `canCompleteAppointment`
**File:** `service/VehicleOwnershipService.java` (60 lines)
**Problem:** Has `canAccessVehicle/Part/Document/Alert` but nothing for appointments. No way to verify shop-rep ownership of an appointment.
*Source: TODO T3*

---

### 2.8 🟡 P1 — No status transition validation
**File:** `AppointmentServiceImpl.java`
**Problem:** `PATCH /{id}/status` allows ANY transition. A `COMPLETED` → `PENDING` or `CANCELLED` → `COMPLETED` transition is allowed. No state machine enforcement.

### 2.9 🟡 P1 — No @Valid on RegisterRequest
**File:** `security/controller/AuthController.java` line 22
**Problem:** `@RequestBody RegisterRequest request` — no `@Valid`. Plus `RegisterRequest` itself has no `@NotBlank`, `@Email`, `@Size` annotations. Users can register with empty strings.

### 2.10 🟡 P1 — No @Valid on LoginRequest
**File:** `security/controller/AuthController.java` line 27

---

### 2.11 🟡 P2 — `service_shop_id` population on registration
**File:** `AuthService` / `RegisterRequest`
**Problem:** Confirm `service_shop_id` is actually populated for `SERVICE_SHOP_REPRESENTATIVE` signups — otherwise `my-appointments` always throws `BadRequestException`.
*Source: TODO2 P8*

### 2.12 🟡 P2 — `canAccessVehicle` returns `true` on not-found
**File:** `VehicleOwnershipService.java` line 31
**Problem:** `.orElse(true)` — if vehicle not found, access is granted. Inconsistent (later 404, but guard should fail-closed).

---

## Part 3 — Backend: Missing Tests (P1)

> [!WARNING]
> The spec requires an `AppointmentCompletionTest`. Only 2 test classes exist (7 tests total). No coverage for appointments, alerts, consumable parts, legal documents, mileage, service shops, or monitoring.

### 3.1 🔴 No `AppointmentCompletionTest`
Integration test: seed vehicle + overdue part + `WEAR` alert + appointment → complete → assert alert resolved, part reset, status COMPLETED. Must also cover idempotency (§1.1) and cross-shop denial (§2.1).
*Source: TODO2 P9, TODO T4*

### 3.2 🔴 No `AppointmentControllerTest`
Test: unauth → 401; valid create → 201; cross-tenant create/read → 403; non-rep status update → 403.
*Source: TODO2 P10, TODO T4*

---

## Part 4 — Backend: Database Migrations (P1)

### 4.1 🟡 `V9__appointment_completion.sql` needed
Add to `appointments`: `recorded_mileage INTEGER`, `total_cost NUMERIC(12,2)`, `mechanic_notes TEXT`, `completed_at TIMESTAMP`, `completed_by_id UUID`.
*Source: TODO T1*

### 4.2 🟡 `appointment_reset_parts` join table needed
`appointment_id UUID → appointments(id)`, `part_id UUID → consumable_parts(id)`, PK `(appointment_id, part_id)`. Audit of which parts a completion reset.
*Source: TODO T1*

### 4.3 🟡 V1 role enum mismatch residue
V1 inserted `SERVICE_SHOP` but Java enum is `SERVICE_SHOP_REPRESENTATIVE`. V3 converted to VARCHAR but didn't migrate old values. Any early `SERVICE_SHOP` rows won't match.

---

## Part 5 — Backend: Notifications (P1)

### 5.1 🟡 `AlertType.java` missing `SERVICE_COMPLETED`
**File:** `model/AlertType.java` lines 3-6 — only `WEAR`, `EXPIRY`.

### 5.2 🟡 `EmailConsumer` doesn't handle `SERVICE_COMPLETED`
**File:** `service/EmailConsumer.java` lines 34-38 — exhaustive switch only covers WEAR/EXPIRY. Adding the enum without the case → runtime crash.

### 5.3 🟡 Completion flow never publishes notification
`AppointmentServiceImpl` never calls `NotificationService.publishAlert()`.

---

## Part 6 — Backend: Code Quality (P1/P2/P3)

### 6.1 🟡 P1 — `@EnableScheduling` missing
**File:** No config class has `@EnableScheduling`
**Problem:** `MonitoringService.java` uses `@Scheduled(cron = "0 0 8 * * *")` but without `@EnableScheduling`, the daily check **never fires**. Alerts for expiring documents/worn parts are never generated.
**Fix:** Add `@EnableScheduling` to `JpaAuditingConfig` or a new config class.

### 6.2 🟡 P1 — No CORS configuration
**Problem:** No CORS config anywhere. Frontend requests from `localhost:5173` will be blocked by browser CORS policy unless a reverse proxy handles it.
**Fix:** Add `@CrossOrigin` or a `WebMvcConfigurer` bean with allowed origins.

---

### 6.3 🟡 P2 — `MaintenanceRecordRepository` — Dead empty interface
**File:** `repository/MaintenanceRecordRepository.java` (5 lines)
Doesn't extend `JpaRepository`. No entity exists. Dead code.

### 6.4 🟡 P2 — `Appointment` model — Duplicate `@CreatedDate`
**File:** `model/Appointment.java` lines 43-44 and 59-61
Both `requestedAt` and `createdAt` have `@CreatedDate`. Both always get the same value.

### 6.5 🟡 P2 — `VehicleServiceImpl.deleteVehicle` — Silent no-op
**File:** `service/impl/VehicleServiceImpl.java` line 57
`deleteById(id)` doesn't throw if vehicle doesn't exist. Should throw `ResourceNotFoundException`.

### 6.6 🟡 P2 — `AlertEvent` missing `serialVersionUID`
**File:** `dto/AlertEvent.java` — implements `Serializable` without the field. Deserialization fragile.

### 6.7 🟡 P2 — Appointment status transition not validated
Any transition is allowed (COMPLETED → PENDING, CANCELLED → COMPLETED). Need a state machine.

---

### 6.8 🟡 P3 — JWT secret hardcoded as default
**File:** `application.yml` line 38 — well-known tutorial key as fallback.

### 6.9 🟡 P3 — CSRF disabled globally
**File:** `security/config/SecurityConfig.java` line 28 — acceptable for stateless JWT but should be documented.

### 6.10 🟡 P3 — No rate limiting on auth endpoints
`/api/v1/auth/register` and `/authenticate` — brute-force vector.

---

## Part 7 — Frontend: Build Blockers (P0)

> [!CAUTION]
> These 3 issues will cause TypeScript compilation failures. The app **cannot build** with these present.

### 7.1 🔴 `appointments.tsx` — Imports non-existent types
**File:** `frontend/src/routes/_authenticated/appointments.tsx` line 14
```tsx
import type { AppointmentDto, AppointmentStatus, ServiceShop } from '@/api/schemas'
```
None of `AppointmentDto`, `AppointmentStatus`, `ServiceShop` exist in `src/api/schemas.ts`. The file only defines: `Vehicle`, `MileageLog`, `ConsumablePart`, `LegalDocument`, `MaintenanceAlert`.
**Fix:** Add these types to `schemas.ts` or import from the generated Orval zod types.

### 7.2 🔴 `appointments.tsx` — Accesses non-existent auth store property
**File:** `appointments.tsx` line 22
```tsx
const user = useAuthStore((s) => s.user)
```
`auth.store.ts` only has `token`, `email`, `role`, `login`, `logout`. There is no `.user` property.

### 7.3 🔴 `analytics.tsx` — Pie chart always empty (logic bug)
**File:** `analytics.tsx` lines 49-52
`vehicleStatusFor()` returns `'ACTIVE' | 'IN SERVICE' | 'NEEDS ATTENTION'` but `statusCounts` has keys `active`, `maintenance`, `inactive`. Since `statusCounts['ACTIVE']` is always `undefined`, the condition `!== undefined` is always false. **The vehicle status pie chart renders zero data.**

---

## Part 8 — Frontend: Missing Features (P1/P2)

### 8.1 🟡 P1 — No `service.tsx` hub page
**Problem:** TODO spec calls for `routes/_authenticated/service.tsx` — a role-aware page where reps see their queue + completion form, and managers see scheduling + request history. Instead, `appointments.tsx` exists but is incomplete and broken (§7.1–7.2).
*Source: TODO T5*

### 8.2 🟡 P1 — No Service tab on vehicle detail page
**File:** `vehicles/$vehicleId.tsx` line 16
`type Tab = 'details' | 'mileage' | 'parts' | 'documents'` — no `'service'`.
Despite the API having `useGetAppointmentsByVehicle`, there's no UI to show completed appointments for a vehicle.
*Source: TODO T6*

### 8.3 🟡 P1 — No toast notification system
No `ToastProvider`, no `useToast()` hook, no toast library. Mutations succeed/fail silently. `__root.tsx` and `main.tsx` have no toast provider mounted.
*Source: TODO T8*

### 8.4 🟡 P1 — Search bar is non-functional
**File:** `_authenticated.tsx` lines 411-431
The search `<input>` has no `onChange` handler, no state, no search logic. Purely decorative.
*Source: TODO T8*

### 8.5 🟡 P1 — No shared components extracted
**File:** `src/components/` only has `StatusBadge.tsx`
Missing: `Card`, `PageHeader`, `Field`, `Modal`, `Button`, `Spinner`, `EmptyState`, `StatCard`, `ProgressBar`. All duplicated inline across 4+ files.
*Source: TODO T7*

---

### 8.6 🟡 P2 — Vehicle display still a table, not card grid
**File:** `vehicles/index.tsx` lines 153-184 — `<table>` with `<thead>`/`<tbody>`.
No `VehicleCard` or `VehiclePlaceholder` component. Dashboard also uses table.
*Source: TODO T7*

### 8.7 🟡 P2 — `schemas.ts` missing appointment/service types
Has `Vehicle`, `MileageLog`, `ConsumablePart`, `LegalDocument`, `MaintenanceAlert` — no appointment or service-shop types.

### 8.8 🟡 P2 — `query-keys.ts` missing appointment/service keys
Has: `vehicles`, `mileage`, `consumables`, `legalDocs`, `alerts`.
Missing: `appointments`, `serviceShops`. Appointments page uses hardcoded strings `['service-shops']` instead.

---

## Part 9 — Frontend: UI/UX & Accessibility (P2/P3)

### 9.1 🟡 P2 — Decorative buttons mislead users
| Button | File | Problem |
|--------|------|---------|
| "Generate Report" | `_authenticated.tsx` L352-367 | No click handler |
| "Settings" | `_authenticated.tsx` L370-373 | No click handler |
| "Support" | `_authenticated.tsx` L376-379 | No click handler |
| "Export Data" | `dashboard.tsx` L271-276 | No click handler |
| Bell notification | `_authenticated.tsx` L437-440 | No click handler |

### 9.2 🟡 P2 — Dashboard Quick Actions permanently disabled
**File:** `dashboard.tsx` lines 238-266
Three buttons (Drivers, Fuel Logs, Schedule) are `disabled` with `cursor-not-allowed` — no indication these are planned/stub features.

### 9.3 🟡 P2 — Modal has no keyboard support
**File:** `vehicles/index.tsx` — modal has no Escape key handler, no focus trap, no focus restoration.

### 9.4 🟡 P2 — Delete without confirmation
**File:** `$vehicleId.tsx` — parts tab delete (L361) and documents tab delete (L491) fire immediately without confirmation dialogs.

### 9.5 🟡 P2 — No mobile responsive sidebar
Sidebar is fixed 208px (`w-52`) with no hamburger menu or collapse on mobile.

---

### 9.6 🟡 P3 — Accessibility: Missing aria-labels
- Search input (`_authenticated.tsx` L426-430) — no `<label>`, no `aria-label`, no `id`
- Bell button (`_authenticated.tsx` L437-440) — no `aria-label`
- Gear button (`_authenticated.tsx` L443-445) — no `aria-label`

### 9.7 🟡 P3 — Alerts nav item inconsistent pattern
**File:** `_authenticated.tsx` L319-338 — uses raw `<Link>` with duplicated className props instead of `NavItem` component.

### 9.8 🟡 P3 — Dead code: `DisabledNavItem` component
**File:** `_authenticated.tsx` L503-519 — defined but never used anywhere.

### 9.9 🟡 P3 — Dead code: `App.tsx` + `App.css`
Vite boilerplate starter template (counter, logos). Never imported. Should be deleted.

### 9.10 🟡 P3 — No 404 page
No `notFound` component in `__root.tsx`.

### 9.11 🟡 P3 — No loading states on route transitions
No `pendingComponent` defined on any route.

### 9.12 🟡 P3 — Query key inconsistency
Appointments page uses hardcoded string keys (`['/v1/appointments/my-requests']`) while everything else uses the centralized `queryKeys` object. Cache invalidation will miss.

### 9.13 🟡 P3 — Generated schemas file outdated
`vehicleManagementSystemAPI.schemas.ts` only has vehicle/auth/health types — missing appointment, service-shop, alert, consumable, legal-document TypeScript interfaces.

---

## Part 10 — Infrastructure (P1/P2/P3)

### 10.1 🟡 P1 — `@EnableScheduling` not present (repeated from §6.1)
The daily `MonitoringService` cron for wear/expiry checks **never fires** without this. This means iteration-2 alerting is broken in production.

### 10.2 🟡 P2 — README is broken/unprofessional
**File:** `README.md`
- Title is "Spanish Inquisition" (placeholder joke)
- Content has broken box-drawing characters from terminal copy-paste
- No project description, no architecture overview, no tech stack listed

### 10.3 🟡 P2 — `docker-compose.yml` uses deprecated `version` key
**File:** `docker-compose.yml` line 1 — `version: '3.8'` is deprecated in modern Docker Compose.

### 10.4 🟡 P3 — CI Postgres version mismatch
**File:** `.github/workflows/ci.yml` line 14 — uses `postgres:16-alpine` while `docker-compose.yml` uses `postgres:15-alpine`.

### 10.5 🟡 P3 — `.env.example` JWT secret is the production default
Matches the hardcoded fallback in `application.yml`. Copy-pasting the example file gives a known key.

---

## Part 11 — Real-time / Live Updates (NEW — P1/P2)

> [!WARNING]
> Client ↔ service-shop interaction is **not instant**. When an owner creates an appointment, the shop rep's UI does not change until a refetch; when a shop completes a service, the owner's UI does not change either. The only cross-user signal is **email** (RabbitMQ → MailHog), fired on completion to the owner.

### 11.1 Current behavior (why it's not live)
- `query-client.ts`: `staleTime` 5 min, **no `refetchInterval`**. Queries refetch only on mount, tab refocus (react-query default), or explicit `invalidateQueries`.
- A mutation invalidates **the acting user's own** cache only — not other users' sessions.
- RabbitMQ is wired solely to `EmailConsumer`. **No WebSocket, no SSE** — the browser never receives server push.
- Net effect: shop rep must reload to see new requests; owner must reload to see completion (or read the email).

### 11.2 Options
| Approach | Effort | Latency | Notes |
|---|---|---|---|
| **Polling** — add `refetchInterval` (~10–15 s) to `useGetAppointmentsByShop` / owner queries | tiny | ~interval | MVP-friendly; no backend change; minor wasted traffic |
| **SSE** — `GET /v1/appointments/stream`, server pushes events | medium | instant | one-way (server→client); fits "new appointment" + "completed"; lighter than WS |
| **WebSocket** (Spring STOMP) | larger | instant | bidirectional; overkill here |
| **In-app notification bell** fed by polling/SSE | medium | — | nav bell currently decorative (§9.1) |

### 11.3 Recommendation
MVP: **polling** now (1 line per query). Upgrade to **SSE** if true push is wanted without WebSocket weight. Reuse the existing `AlertEvent`/RabbitMQ flow as the event source for SSE.

### 11.4 ✅ Done (2026-06-05) — polling
`refetchInterval: 10_000` added to the appointment queries:
- `appointments.tsx` — `useGetMyRequestedAppointments` (owner) + `useGetAppointmentsByShop` (rep)
- `vehicles/$vehicleId.tsx` — `useGetAppointmentsByVehicle` (Service tab)

Effect: rep sees new requests, owner sees completion status flip, within ~10 s, no manual refresh. No backend change, no new deps. **Still outstanding:** true push (SSE/WebSocket), in-app notification bell, polling on alerts/dashboard queries (owner's alert list still updates only on refetch/refocus).

---

## Recommended Execution Order

> [!IMPORTANT]
> Work bottom-up: fix build blockers first, then the backend core logic, then layer on features.

### Phase 1 — Stop the bleeding (P0 fixes)
1. Fix `appointments.tsx` build errors (§7.1, §7.2, §7.3) — add missing types to `schemas.ts`, fix auth store usage, fix analytics logic bug
2. Add double-completion guard (§1.1)
3. Add RBAC to unprotected endpoints (§2.1–2.6)
4. Add `canCompleteAppointment` to `VehicleOwnershipService` (§2.7)

### Phase 2 — Core completion flow (P0/P1)
5. Create `V9__appointment_completion.sql` migration (§4.1, §4.2)
6. Add completion fields to `Appointment.java` entity (§1.3)
7. Create `POST /{id}/complete` endpoint with `CompleteAppointmentRequest` DTO (§1.5, §1.2)
8. Add `SERVICE_COMPLETED` to `AlertType` + `EmailConsumer` (§5.1, §5.2)
9. Implement completion notification (§5.3, §1.4)
10. Add `@EnableScheduling` (§6.1)
11. Add CORS configuration (§6.2)

### Phase 3 — Tests (P1)
12. Write `AppointmentCompletionTest` (§3.1)
13. Write `AppointmentControllerTest` (§3.2)

### Phase 4 — Frontend features (P1/P2)
14. Add shared components: Toast, Modal, Spinner, etc. (§8.5)
15. Build service hub page (§8.1) with completion UI
16. Add Service tab to vehicle detail (§8.2)
17. Wire search bar (§8.4)
18. Convert vehicle display to card grid (§8.6)
19. Add query keys + schema types (§8.7, §8.8)

### Phase 5 — Polish (P2/P3)
20. Fix status transition validation (§2.8)
21. Add @Valid to auth endpoints (§2.9, §2.10)
22. Clean up dead code (§9.8, §9.9, §6.3)
23. Fix decorative buttons — either implement or mark as "Coming Soon" (§9.1)
24. Add keyboard support to modals (§9.3)
25. Add delete confirmations (§9.4)
26. Add aria-labels (§9.6)
27. Fix README (§10.2)
28. Remaining P3 items

---

## Verification Plan

### Automated
```bash
cd backend && ./gradlew build          # Flyway + all tests including completion integration
cd frontend && npm run build           # TypeScript compilation
cd frontend && npm run lint            # ESLint
```

### Manual E2E
1. `docker-compose up` → backend :8081
2. `cd frontend && npm run generate && npm run dev`
3. Register FLEET_MANAGER + SERVICE_SHOP_REPRESENTATIVE
4. As manager: add vehicle + low-lifespan part → log mileage to trip WEAR alert
5. As manager: `/service` → schedule appointment, assign shop rep
6. As shop rep: `/service` → complete appointment (reset part, clear alert)
7. **Assert:** alert gone from `/alerts` + dashboard; part progress reset; Service tab shows record; toast fires; MailHog shows "service completed" email
8. **RBAC:** shop rep with no appointment → 403; allowed once assigned
9. **Double-completion:** re-POST `/complete` → 409
