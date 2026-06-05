# Iteration 3 — Remaining Work

## Context

Direction adopted: **Appointment + ServiceShop** entity design landed by PR #8
(*feat: implement ServiceShop and Appointment domain, fix tests, setup CI*).
`PLAN.md`'s original `service_jobs` / `service_records` approach is **superseded**
— see the [Superseded](#superseded-was-in-planmd-dropped-by-adopting-pr-8) note at
the bottom. This file tracks only what is still undone.

### ✅ Already landed in PR #8 (do not redo)
- `model/Appointment.java` (→ legacy `appointments` table, `appointment_status` PG
  enum), `model/AppointmentStatus.java` (`PENDING, ACCEPTED, REJECTED, COMPLETED,
  CANCELLED`).
- `model/ServiceShop.java` (→ legacy `service_shops` table; `name`, `address`,
  `contactEmail`, `contactPhone`, `approved`).
- Repos: `AppointmentRepository` (`findByVehicleId` / `findByRequestedById` /
  `findByTargetShopId`), `ServiceShopRepository` (`findByApprovedTrue`).
- DTOs + MapStruct mappers for both; services + impls; controllers
  `/v1/appointments` and `/v1/service-shops`.
- CI (`.github/workflows/ci.yml`), `HealthController`, `BaseIntegrationTest`, test fixes.
- Generated frontend clients committed: `src/api/generated/appointment/`,
  `src/api/generated/service-shop/`, `health-controller`, + `openapi.json`,
  `routeTree.gen.ts`.

---

## Part A — Backend (the headline rule is NOT implemented)

PR #8's `updateAppointmentStatus` only sets a status string. The iteration-3
deliverable — **completing a service auto-clears active alerts and resets
consumable-part limits** — does not exist yet.

### 🔴 T1. Migration `V7__appointment_completion.sql`
- Add to `appointments`: `recorded_mileage INTEGER`, `total_cost NUMERIC(12,2)`,
  `mechanic_notes TEXT`, `completed_at TIMESTAMP`.
- Join table `appointment_reset_parts` (`appointment_id UUID → appointments(id) ON
  DELETE CASCADE`, `part_id UUID → consumable_parts(id) ON DELETE CASCADE`,
  PK `(appointment_id, part_id)`) — history of which parts a completion reset.
- `ddl-auto=validate`, so add the matching `@Column` / `@ManyToMany` fields on
  `Appointment.java`.

### 🔴 T2. Completion endpoint + business logic
- `dto/CompleteAppointmentRequest` (`recordedMileage`, `totalCost`, `mechanicNotes`,
  `List<UUID> resetPartIds`, `List<UUID> resolveAlertIds`).
- `AppointmentService.completeAppointment(UUID id, CompleteAppointmentRequest)` impl,
  `@Transactional`:
  1. Load appointment; guard against double-completion (status already `COMPLETED`).
  2. For each `resetPartId`: set `lastReplacedMileage = recordedMileage` (fallback
     `vehicle.currentMileage`), `maintenanceRequired = false`, save. Reuse reset
     semantics from `ConsumablePartServiceImpl`.
  3. Resolve `resolveAlertIds` and any unresolved `WEAR` alert whose
     `referenceId == "wear_" + partId` per reset part. Reuse `AlertService.resolve(UUID)`
     + `MaintenanceAlertRepository.findByVehicle_IdAndResolvedFalse` /
     `existsByReferenceIdAndResolvedFalse`.
  4. Persist completion fields + reset-parts join; set status `COMPLETED`,
     `completedAt = now`.
  5. Notify owner via existing MailHog path: add `SERVICE_COMPLETED` to
     `model/AlertType.java` (only `WEAR`, `EXPIRY` today) and a matching case to
     `EmailConsumer.buildSubject` / `buildBody` (switch is exhaustive — won't compile
     without it), then `NotificationService.publishAlert(...)` to `vehicle.owner`.
- `AppointmentController`: `POST /v1/appointments/{id}/complete`.

### 🔴 T3. RBAC — `AppointmentController` is currently wide open
PR #8 added no `@PreAuthorize` / ownership checks on `/v1/appointments` — any
authenticated user can create/read/cancel/complete anyone's appointments.
- `VehicleOwnershipService`: add `canCompleteAppointment(UUID appointmentId)` (true
  when current user is the appointment's `targetShop` rep / assigned) and reuse
  `canAccessVehicle` for create.
- Guard endpoints, mirroring `MileageController` / `AlertController`:
  - `POST` create → `hasAnyRole('ADMIN','FLEET_MANAGER','STANDARD_USER') and
    @vehicleAccess.canAccessVehicle(#request.vehicleId)`.
  - `GET /vehicle/{vehicleId}` → `@vehicleAccess.canAccessVehicle(#vehicleId)`.
  - `GET /shop/{shopId}` / `PATCH /{id}/status` / `POST /{id}/complete` → assigned
    shop rep or requester/admin.
- **Open question — resolve before T3 guards:** decide shop-rep ↔ `ServiceShop`
  linking. `targetShopId` is a `ServiceShop` PK, but RBAC needs to map the logged-in
  `SERVICE_SHOP_REPRESENTATIVE` user to a shop. Pick: (a) add `shop_id` FK on `users`,
  or (b) match by the rep's `email == ServiceShop.contactEmail`.

### 🔴 T4. Tests
- `AppointmentControllerTest`: unauth → 401; manager creates → 201; RBAC denies
  cross-tenant access (403).
- **`AppointmentCompletionTest`** (the integration test the brief requires, extends
  `BaseIntegrationTest`): seed vehicle + overdue consumable part + `WEAR` alert +
  appointment assigned to a shop rep → `POST /complete` → assert alert
  `resolved=true`, part `maintenanceRequired=false` & `lastReplacedMileage` advanced,
  appointment `COMPLETED`, completion fields persisted.

---

## Part B — Frontend (only the generated client exists; no UI yet)

Regen after backend T1–T3: `cd frontend && npm run generate` (backend up on :8081)
to pick up the `/complete` endpoint into `src/api/generated/appointment/appointment.ts`.
Add entity/form types to `src/api/schemas.ts`; query keys (`appointments`,
`serviceShops`) to `src/lib/query-keys.ts`.

### 🟡 T5. Service hub — `routes/_authenticated/service.tsx` (new), role-aware
- **Shop rep:** queue from `GET /v1/appointments/shop/{shopId}`; clicking a job opens
  a Completion form (date, recorded mileage, total cost, notes, checkbox list of the
  vehicle's consumable parts + unresolved alerts) → `POST /v1/appointments/{id}/complete`.
- **Manager / owner / admin:** "Schedule Service" — create appointment (pick vehicle +
  shop from `GET /v1/service-shops/approved`) + list own requests from
  `GET /v1/appointments/my-requests` with status.
- `routes/_authenticated.tsx`: replace disabled `DisabledNavItem "Service"` (`:502`)
  with a real `NavItem to="/service"`.

### 🟡 T6. Service history tab
- `routes/_authenticated/vehicles/$vehicleId.tsx`: add a **"Service"** tab (`Tab`
  union `:16`) listing completed appointments from `GET /v1/appointments/vehicle/{vehicleId}`
  (filter `status === COMPLETED`) — date, mileage, cost, notes, parts reset. Read-only.

### 🟡 T7. Shared components + cleaner vehicle display (carried from PLAN B1–B2)
- Extract `Card`, `PageHeader`, `Field` (+`inputCls`), `Modal`, `Button`, `Spinner`,
  `EmptyState`, `StatCard`, `ProgressBar` into `src/components/`; refactor
  `vehicles/index.tsx`, `$vehicleId.tsx`, `dashboard.tsx`, `alerts.tsx`.
- `VehicleCard.tsx` + `VehiclePlaceholder.tsx` (inline SVG car, tint by id hash); swap
  the vehicles `<table>` for a responsive card grid.

### 🟡 T8. Toasts + functional search (carried from PLAN B5)
- `components/ToastProvider.tsx` (context + portal, no new dep) in `routes/__root.tsx`;
  fire on vehicle save/delete, alert resolve, appointment create + completion.
- Wire the top-bar search (`_authenticated.tsx:588`) → navigate `/vehicles?q=`;
  `vehicles/index.tsx` reads `q` and filters by name/model/VIN.

---

## Part C — Docs (brief deliverable)
Interaction/sequence diagram for the completion scenario (manager requests → shop rep
completes → alerts cleared & parts reset → owner notified) in the team's Visual Paradigm
project. Out of repo scope; hand-off item.

---

## Verification
1. `cd backend && ./gradlew build` (Flyway V7 + completion integration test).
2. `docker-compose up` → backend :8081.
3. `cd frontend && npm run generate` then `npm run dev`.
4. Manual E2E: register `FLEET_MANAGER` + `SERVICE_SHOP_REPRESENTATIVE`; add vehicle +
   low-lifespan part; log mileage to trip a `WEAR` alert; manager `/service` → schedule
   appointment to the rep; rep `/service` → complete (reset part, clear alert) → assert
   alert gone from `/alerts` + dashboard badge, part progress reset, "Service" tab shows
   record, success toast, and the "service completed" email in MailHog
   (http://localhost:8025).
5. `npm run build` + `npm run lint`.
6. RBAC: shop rep with no appointment on a vehicle → 403; allowed once assigned.

## Superseded (was in PLAN.md, dropped by adopting PR #8)
- `ServiceJob` / `ServiceRecord` entities + V7 create-tables migration.
- `DROP` of `appointments` / `service_shops` / `maintenance_records` (now kept/mapped).
- "No separate `ServiceShop` entity / rep-user-is-the-shop" decision — reversed;
  `ServiceShop` is a real entity with admin approval.
- `UserRepository.findByRole` shop directory — replaced by `/v1/service-shops`.
