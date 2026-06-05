# Iteration 3 — Collaborative Hub & Final Polish

## Context

Iterations 1 (auth + RBAC + Vehicle CRUD) and 2 (mileage tracking, consumable
parts, legal documents, monitoring engine + email alerts) are complete and
merged. The planning doc's **Iteration 3** goal is to "complete the ecosystem by
connecting all user roles" via two use cases — **Log Service Completion** and
**View Dashboard & Alerts** — tailored to the **Service Shop** actor, where
recording a service intervention **automatically clears active alerts and resets
consumable part limits**.

The codebase already anticipates this: the `Role` enum has
`SERVICE_SHOP_REPRESENTATIVE`, the register form offers it, and there are **empty
stub classes** (`ServiceShop.java`, `Appointment.java`, `MaintenanceRecordRepository`,
`AppointmentRepository`) plus legacy DB tables (`service_shops`, `appointments`,
`maintenance_records`) left from an abandoned early design. These legacy tables
are unmapped and inconsistent with the conceptual model, so iteration 3 builds a
clean **work-order → service-record** flow instead of resurrecting them.

### Decisions locked in (from user)
1. **Workflow:** work-order / appointment-driven. A Fleet Manager/owner requests
   service on a vehicle and assigns it to a Service Shop rep; the rep sees a
   queue of assigned jobs and logs completion against a job.
2. **Shop identity:** the `SERVICE_SHOP_REPRESENTATIVE` **user account is the
   shop** — jobs/records link to that user. No separate `ServiceShop` entity /
   user↔shop linking.
3. **Website polish:** wire the Service nav + role-aware Service hub; visual
   polish pass; functional top-bar search; toast notifications; **cleaner
   card-based vehicle display with placeholder car images**; **extract & reuse
   shared components**.

---

## Part A — Backend (Spring Boot)

Package base: `com.AutoSync.vehicle_management_system`. Follow existing patterns:
JPA entity + Lombok builder + UUID v7 `@UuidGenerator(style = TIME)`, MapStruct
`@Mapper(componentModel = "spring")`, `@Data` request DTOs with jakarta
validation, `@PreAuthorize` + the `@vehicleAccess` bean for RBAC.

### A1. Migration — `V7__iteration3_service.sql`
`backend/src/main/resources/db/migration/V7__iteration3_service.sql`
- `service_jobs` — `id UUID PK`, `vehicle_id UUID NOT NULL → vehicles(id) ON DELETE CASCADE`,
  `requested_by_id UUID → users(id)`, `assigned_shop_id UUID → users(id)` (the
  shop-rep user), `status VARCHAR(20) NOT NULL DEFAULT 'REQUESTED'`,
  `description TEXT`, `scheduled_for TIMESTAMP`, `created_at`, `updated_at`.
  Indexes on `assigned_shop_id`, `vehicle_id`, `status`.
- `service_records` — `id UUID PK`, `vehicle_id UUID NOT NULL`, `job_id UUID → service_jobs(id)`
  (nullable), `serviced_by_id UUID → users(id)`, `date_performed DATE NOT NULL`,
  `recorded_mileage INTEGER`, `total_cost NUMERIC(12,2)`, `mechanic_notes TEXT`,
  `created_at`. Index on `vehicle_id`.
- `service_record_parts` — join table `record_id UUID → service_records(id) ON DELETE CASCADE`,
  `part_id UUID → consumable_parts(id) ON DELETE CASCADE`, PK `(record_id, part_id)`.
  Records which consumable parts were reset by a given service record (for history).
- **Cleanup (forward-only):** `DROP TABLE IF EXISTS appointments, maintenance_records, service_shops CASCADE;`
  and `DROP TYPE IF EXISTS appointment_status;` — these are dead/unmapped and use
  the abandoned BIGINT-era design. (Mention in plan; safe since nothing maps them.)

### A2. Domain model
- `model/ServiceJobStatus.java` — enum `REQUESTED, ACCEPTED, COMPLETED, CANCELLED`.
- `model/ServiceJob.java` — entity (`@Table(name="service_jobs")`), mirrors
  `Vehicle.java` style. `@ManyToOne` to `vehicle`, `requestedBy` (User),
  `assignedShop` (User). `@Enumerated(STRING)` status. Auditing fields.
- `model/ServiceRecord.java` — entity (`@Table(name="service_records")`).
  `@ManyToOne` vehicle/job/servicedBy; `datePerformed`, `recordedMileage`,
  `totalCost (BigDecimal)`, `mechanicNotes`; `@ManyToMany` (or `@OneToMany` via
  join entity) to the `ConsumablePart`s reset, mapped to `service_record_parts`.
- **Delete the empty stubs** once replaced: `model/ServiceShop.java`,
  `model/Appointment.java`, `repository/MaintenanceRecordRepository.java`,
  `repository/AppointmentRepository.java` (they compile but are dead; removing
  keeps the model coherent — confirm no imports first via grep).

### A3. Repositories
- `repository/ServiceJobRepository extends JpaRepository<ServiceJob, UUID>`:
  `findByAssignedShop_IdOrderByCreatedAtDesc`, `findByVehicle_Id`,
  `findByRequestedBy_Id`.
- `repository/ServiceRecordRepository extends JpaRepository<ServiceRecord, UUID>`:
  `findByVehicle_IdOrderByDatePerformedDesc`.
- `UserRepository`: add `List<User> findByRole(Role role)` (for the shop directory).

### A4. DTOs + mappers
- `dto/CreateServiceJobRequest` (`@NotNull vehicleId`, `@NotNull assignedShopId`,
  `description`, optional `scheduledFor`).
- `dto/UpdateJobStatusRequest` (`ServiceJobStatus status`).
- `dto/CompleteServiceRequest` (`@NotNull datePerformed`, `recordedMileage`,
  `totalCost`, `mechanicNotes`, `List<UUID> resetPartIds`, `List<UUID> resolveAlertIds`).
- `dto/ServiceJobDto`, `dto/ServiceRecordDto`, `dto/ShopRepDto` (id, name, email).
- `mapper/ServiceJobMapper`, `mapper/ServiceRecordMapper` — MapStruct, mapping
  nested ids like `ConsumablePartMapper` (`@Mapping(target="vehicleId", source="vehicle.id")`).

### A5. Service layer — the core iteration-3 business rule
- `service/ServiceJobService` (+ `impl/ServiceJobServiceImpl`):
  `createJob`, `listForShop(currentUser)`, `listForVehicle(vehicleId)`,
  `updateStatus(jobId, status)`.
- `service/ServiceRecordService` (+ impl): `completeJob(jobId, CompleteServiceRequest)`
  — **the headline logic**, `@Transactional`:
  1. Load job; verify it's assigned to the current shop-rep user; guard against
     double-completion.
  2. Build + save `ServiceRecord` (link job, vehicle, current user, serviced parts).
  3. **Reset consumable limits:** for each `resetPartId`, set
     `lastReplacedMileage = recordedMileage` (fallback `vehicle.currentMileage`)
     and `maintenanceRequired = false`, then save. Reuse the reset semantics from
     `ConsumablePartServiceImpl.update` (`service/impl/ConsumablePartServiceImpl.java:50`).
  4. **Clear active alerts:** resolve the supplied `resolveAlertIds` **and** any
     unresolved `WEAR` alert whose `referenceId == "wear_" + partId` for each reset
     part. Reuse `AlertService.resolve` (`service/AlertService.java:43`) /
     `MaintenanceAlertRepository.findByVehicle_IdAndResolvedFalse`.
  5. Set job `status = COMPLETED`.
  6. **Notify the owner via the existing MailHog path** (recommended, low cost):
     reuse the iter-2 RabbitMQ → `EmailConsumer` → MailHog pipeline that already
     delivers WEAR/EXPIRY emails. Add a `SERVICE_COMPLETED` case to
     `model/AlertType.java` and to `EmailConsumer.buildSubject`/`buildBody`
     (`service/EmailConsumer.java` — the `switch` is exhaustive, so it needs the
     new case to compile), then `NotificationService.publishAlert(...)` a
     "service completed on <vehicle>" event to `vehicle.owner`. No new infra:
     MailHog is already a `docker-compose` service (SMTP :1025, UI :8025) wired
     via `MAIL_HOST/MAIL_PORT` and `application.yml` `spring.mail`.

### A6. RBAC — give shop reps scoped access
- `service/VehicleOwnershipService.java`: add `canServiceVehicle(UUID vehicleId)`
  returning true if the current user is a `SERVICE_SHOP_REPRESENTATIVE` with a
  `ServiceJob` assigned to them on that vehicle (inject `ServiceJobRepository`).
  Also add `canCompleteJob(UUID jobId)` (job assigned to current user).
- Controllers (`controller/`), mirroring `MileageController`/`AlertController`
  `@PreAuthorize` style:
  - `ServiceJobController` `/v1/service-jobs`:
    `POST` (`hasAnyRole('ADMIN','FLEET_MANAGER','STANDARD_USER') and @vehicleAccess.canAccessVehicle(#request.vehicleId)`);
    `GET /assigned` (`hasRole('SERVICE_SHOP_REPRESENTATIVE')` — my queue);
    `GET /vehicles/{vehicleId}` (`@vehicleAccess.canAccessVehicle(#vehicleId)`);
    `PATCH /{id}/status` (assigned shop or requester/admin).
  - `ServiceRecordController` `/v1/service-records`:
    `POST /jobs/{jobId}/complete` (`hasRole('SERVICE_SHOP_REPRESENTATIVE') and @vehicleAccess.canCompleteJob(#jobId)`);
    `GET /vehicles/{vehicleId}` (`@vehicleAccess.canAccessVehicle(#vehicleId)` — history).
  - `ServiceShopDirectoryController` `GET /v1/service-shops` (`isAuthenticated()`):
    returns `findByRole(SERVICE_SHOP_REPRESENTATIVE)` as `ShopRepDto` so managers
    can pick a shop when creating a job.

### A7. Backend tests
`backend/src/test/java/.../controller/` (mirror `VehicleControllerTest` —
`@SpringBootTest @AutoConfigureMockMvc`, `SecurityMockMvcRequestPostProcessors.user`):
- `ServiceJobControllerTest`: unauth → 401; manager creates job → 201; shop rep
  lists `/assigned`.
- **`ServiceRecordCompletionTest` (the integration test the brief requires):**
  seed vehicle + overdue consumable part + WEAR alert + a job assigned to a shop
  rep → POST complete → assert alert `resolved=true`, part `maintenanceRequired=false`
  & `lastReplacedMileage` advanced, job `COMPLETED`, record persisted.

---

## Part B — Frontend (React + TanStack Router/Query + Orval)

### B0. Regenerate the API client (REQUIRED, after Part A runs)
Backend on :8081, then `cd frontend && npm run generate`
(`node scripts/fetch-spec.mjs && orval`). This writes typed hooks into
`src/api/generated/{service-job-controller, service-record-controller,
service-shop-directory-controller}/` + zod schemas. **Do not hand-write the
client** — the project is fully codegen-driven (see `frontend/orval.config.ts`).
Add entity types (`ServiceJob`, `ServiceRecord`, `ShopRep`, `ServiceJobStatus`)
and any form schemas to `src/api/schemas.ts`; add query keys (`serviceJobs`,
`serviceRecords`) to `src/lib/query-keys.ts`.

### B1. Extract shared components (`src/components/`) — "use components more"
The pages currently duplicate `Field`/`FormField`, `Modal`, `inputCls`, spinners,
empty states, `StatCard`/`SummaryCard`. Extract into reusable components and
refactor `vehicles/index.tsx`, `vehicles/$vehicleId.tsx`, `dashboard.tsx`,
`alerts.tsx` to consume them:
- `Card.tsx`, `PageHeader.tsx`, `Field.tsx` (+ exported `inputCls`),
  `Modal.tsx`, `Button.tsx`, `Spinner.tsx`, `EmptyState.tsx`,
  `StatCard.tsx`, `ProgressBar.tsx`.
- Keep `StatusBadge.tsx` (already shared) and `lib/vehicle-status.ts`.

### B2. Cleaner vehicle display — card grid + placeholder car images
- New `components/VehicleCard.tsx`: image header (placeholder), name/model/year,
  VIN (mono), `StatusBadge`, mileage `ProgressBar`, Edit/Delete + "View" link.
- New `components/VehiclePlaceholder.tsx`: inline SVG car illustration on a soft
  gradient (no binary asset needed; deterministic tint by `vehicle.id` hash so
  cards look varied). This is the "placeholder for car images".
- Refactor `routes/_authenticated/vehicles/index.tsx`: replace the `<table>` +
  `VehicleRow` with a responsive `grid` of `VehicleCard`s (keep create/delete
  modals, now using shared `Modal`). Update `dashboard.tsx` Fleet Inventory
  preview to a compact card/list reusing the same primitives.

### B3. Service hub — wire the nav + role-aware page
- `routes/_authenticated/service.tsx` (new), role-aware via `useAuthStore`:
  - **Service Shop rep:** "Service Queue" (cards from `GET /v1/service-jobs/assigned`)
    + "Completed history". Clicking a job opens a **Completion form** (shared
    `Modal`): date, recorded mileage, total cost, mechanic notes, checkbox list of
    the vehicle's consumable parts to reset (from
    `consumable-part-controller.listByVehicle1`) and unresolved alerts to clear
    (from `alert-controller`), → `POST /jobs/{id}/complete`.
  - **Fleet Manager / owner / admin:** "Schedule Service" — create a job (pick
    vehicle + shop rep from `GET /v1/service-shops`) + list of their requested
    jobs with status.
- `routes/_authenticated.tsx`: replace the disabled `DisabledNavItem "Service"`
  (`:502`) with a real `NavItem to="/service"`; keep it visible to all roles
  (label/landing differs by role inside the page).

### B4. Service history on the vehicle detail page
- `routes/_authenticated/vehicles/$vehicleId.tsx`: add a **"Service"** tab
  (`Tab` union `:16`) listing `ServiceRecord`s from
  `GET /v1/service-records/vehicles/{vehicleId}` — date, mileage, cost, mechanic
  notes, parts reset. Read-only for owners/managers.

### B5. Functional search + toasts
- **Toasts:** `components/ToastProvider.tsx` (small custom context + portal, no new
  dep) mounted in `routes/__root.tsx`; `useToast()` hook. Fire success/error
  toasts on vehicle save/delete, alert resolve, job create, and service
  completion (replacing inline-only messages).
- **Search:** make the top-bar input in `_authenticated.tsx` (`:588`) functional —
  on submit, navigate to `/vehicles?q=...`; `vehicles/index.tsx` reads the `q`
  search param and filters the card grid client-side by name/model/VIN.

### B6. Visual polish pass
Consistent `Card`/`PageHeader`, real empty states (`EmptyState`), loading
skeletons via `Spinner`, and align the service-history / parts-reset visuals to
the high-fidelity GUI prototype (`Desktop/.../GUI prototype/Service&Maintenance.png`).

---

## Part C — UML / docs artifacts (brief deliverable)
The brief asks for **interaction diagrams for the service completion scenario** +
**integration tests**. The integration test is A7. For the diagrams, add a short
note/sequence sketch (manager requests job → shop rep completes → alerts cleared
& parts reset → owner notified) to the team's Visual Paradigm project under
`Desktop/SE_Phase_I_.../` — out of repo scope; mention as a hand-off item, not a
code change.

---

## Verification (end-to-end)

1. **Backend builds + migrates:** `cd backend && ./gradlew build` (runs Flyway
   V7 + all tests, incl. the completion integration test).
2. **Run stack:** `docker-compose up` (Postgres + RabbitMQ + backend on :8081).
3. **Regen client:** `cd frontend && npm run generate` (backend must be up).
4. **Frontend:** `npm run dev`, then manually:
   - Register/login a `FLEET_MANAGER` and a `SERVICE_SHOP_REPRESENTATIVE`.
   - As manager: add a vehicle, a consumable part (low lifespan), log mileage to
     trip a WEAR alert (visible on dashboard/alerts).
   - As manager: `/service` → schedule a job for that vehicle, assign the shop rep.
   - As shop rep: `/service` → job appears in queue → complete it (reset the part,
     clear the alert).
   - **Assert:** alert disappears from `/alerts` & dashboard badge; the part's
     progress bar resets and "Overdue" tag clears on the vehicle "Parts" tab; the
     "Service" tab shows the new record; a success toast fires.
   - **Email:** open MailHog UI at http://localhost:8025 and confirm the
     "service completed" email landed (same place iter-2 WEAR/EXPIRY emails go).
5. **Lint/typecheck:** `cd frontend && npm run build` (tsc) + `npm run lint`.
6. **RBAC check:** confirm a shop rep cannot access a vehicle with no job assigned
   to them (403), and can once a job is assigned.

## Out of scope / deferred
- Separate `ServiceShop` entity (decided against — rep user is the shop).
- Production SMTP — email stays on MailHog (dev) as already configured.
- Analytics nav, fuel logs, "Generate Report"/"Export Data" buttons remain stubs.
