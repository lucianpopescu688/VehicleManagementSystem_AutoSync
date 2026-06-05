import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { get, update } from '@/api/generated/vehicle-controller/vehicle-controller'
import { CreateVehicleSchema, type CreateVehicleInput, type Vehicle } from '@/api/schemas'
import type { MileageLog, ConsumablePart, ConsumablePartInput, LegalDocument, LegalDocumentInput, DocumentType } from '@/api/schemas'
import { queryKeys } from '@/lib/query-keys'
import { log, history as fetchMileageHistory } from '@/api/generated/mileage-controller/mileage-controller'
import { create2, update2, delete2, listByVehicle1 } from '@/api/generated/consumable-part-controller/consumable-part-controller'
import { create1, update1, delete1, listByVehicle } from '@/api/generated/legal-document-controller/legal-document-controller'
import { useGetAppointmentsByVehicle } from '@/api/generated/appointment/appointment'
import { Field, TextInput, Select } from '@/components'

export const Route = createFileRoute('/_authenticated/vehicles/$vehicleId')({
  component: VehicleDetailPage,
})

type Tab = 'details' | 'mileage' | 'parts' | 'documents' | 'service'

function VehicleDetailPage() {
  const { vehicleId } = Route.useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('details')

  const { data: vehicle, isLoading, isError } = useQuery({
    queryKey: queryKeys.vehicles.detail(vehicleId),
    queryFn: () => get(vehicleId) as Promise<Vehicle>,
    enabled: !!vehicleId,
  })

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading vehicle…
        </div>
      </div>
    )
  }

  if (isError || !vehicle) {
    return (
      <div className="p-8">
        <div className="bg-white border border-slate-100 p-8 text-center max-w-md" style={{ borderRadius: '12px' }}>
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-700 mb-1">Vehicle not found</p>
          <p className="text-xs text-slate-400 mb-4">The vehicle you&apos;re looking for doesn&apos;t exist or was removed.</p>
          <button onClick={() => navigate({ to: '/vehicles' })} className="text-sm font-semibold text-primary hover:text-primary-dark cursor-pointer">
            ← Back to Fleet Details
          </button>
        </div>
      </div>
    )
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'details', label: 'Details' },
    { key: 'mileage', label: 'Mileage' },
    { key: 'parts', label: 'Parts' },
    { key: 'documents', label: 'Documents' },
    { key: 'service', label: 'Service' },
  ]

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-4">
        <Link to="/vehicles" className="text-slate-400 hover:text-primary transition-colors font-medium">Fleet Details</Link>
        <svg className="w-3.5 h-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-slate-600 font-medium">{vehicle.name}</span>
      </nav>

      <div className="mb-5">
        <h1 className="font-[Manrope] text-2xl font-extrabold text-neutral-dark">{vehicle.name}</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          {vehicle.model} &middot; {vehicle.year} &middot; <span className="font-mono text-xs">{vehicle.vin}</span>
          &middot; <span className="font-semibold text-slate-600">{vehicle.currentMileage.toLocaleString()} km</span>
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 rounded-xl p-1 max-w-md">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors cursor-pointer ${
              activeTab === t.key ? 'bg-white text-neutral-dark shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'details' && <EditVehicleForm vehicle={vehicle} />}
      {activeTab === 'mileage' && <MileageTab vehicle={vehicle} />}
      {activeTab === 'parts' && <ConsumablePartsTab vehicle={vehicle} />}
      {activeTab === 'documents' && <LegalDocumentsTab vehicle={vehicle} />}
      {activeTab === 'service' && <ServiceTab vehicle={vehicle} />}
    </div>
  )
}

// ─── Service Tab ──────────────────────────────────────────────────────────────

const APPT_STATUS_STYLES: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  REJECTED: 'bg-red-100 text-red-700',
  ACCEPTED: 'bg-blue-100 text-blue-700',
  PENDING: 'bg-amber-100 text-amber-700',
}

function ServiceTab({ vehicle }: { vehicle: Vehicle }) {
  // Poll every 10s so a completion by the shop shows up without a manual refresh.
  const { data: appointments = [], isLoading } = useGetAppointmentsByVehicle(vehicle.id, {
    query: { refetchInterval: 10_000 },
  })

  if (isLoading) {
    return <p className="text-sm text-slate-400 py-4">Loading service history…</p>
  }

  if (appointments.length === 0) {
    return <p className="text-sm text-slate-400 py-4">No service appointments for this vehicle yet.</p>
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h3 className="font-[Manrope] font-bold text-sm text-neutral-dark">Service History</h3>
      <div className="bg-white border border-slate-100 shadow-sm overflow-hidden" style={{ borderRadius: '12px' }}>
        <ul className="divide-y divide-slate-50">
          {appointments.map((a) => (
            <li key={a.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-neutral-dark">
                      {a.targetShopName ?? 'Service shop'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase ${APPT_STATUS_STYLES[a.status ?? 'PENDING'] ?? 'bg-slate-100 text-slate-600'}`}
                    >
                      {a.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {a.scheduledFor ? `Scheduled ${new Date(a.scheduledFor).toLocaleDateString()}` : 'Not scheduled'}
                    {a.completedAt && ` · Completed ${new Date(a.completedAt).toLocaleDateString()}`}
                  </p>
                  {a.notes && <p className="text-xs text-slate-500 mt-1">{a.notes}</p>}
                  {a.status === 'COMPLETED' && (
                    <p className="text-xs text-slate-500 mt-1">
                      {a.recordedMileage != null && `Mileage: ${a.recordedMileage.toLocaleString()} km`}
                      {a.totalCost != null && ` · Cost: ${a.totalCost}`}
                      {a.mechanicNotes && ` · ${a.mechanicNotes}`}
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ─── Details Tab ─────────────────────────────────────────────────────────────

type FormState = { vin: string; name: string; model: string; year: string; currentMileage: string }

function vehicleToForm(v: Vehicle): FormState {
  return { vin: v.vin, name: v.name, model: v.model, year: String(v.year), currentMileage: String(v.currentMileage) }
}

function EditVehicleForm({ vehicle }: { vehicle: Vehicle }) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [form, setForm] = useState<FormState>(() => vehicleToForm(vehicle))
  const [formErrors, setFormErrors] = useState<Partial<Record<string, string>>>({})
  const [savedOk, setSavedOk] = useState(false)

  const updateMutation = useMutation({
    mutationFn: (data: CreateVehicleInput) => update(vehicle.id, data) as Promise<Vehicle>,
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.vehicles.all }); setSavedOk(true) },
    onError: () => setSavedOk(false),
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSavedOk(false)
    const parsed = { vin: form.vin, name: form.name, model: form.model, year: parseInt(form.year), currentMileage: parseFloat(form.currentMileage) }
    const result = CreateVehicleSchema.safeParse(parsed)
    if (!result.success) {
      const fe: Partial<Record<string, string>> = {}
      for (const issue of result.error.issues) { const key = issue.path[0] as string; if (key) fe[key] = issue.message }
      setFormErrors(fe); return
    }
    setFormErrors({})
    updateMutation.mutate(result.data)
  }

  const field = (k: keyof FormState) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => { setForm({ ...form, [k]: e.target.value }); setSavedOk(false) },
  })

  return (
    <div className="bg-white border border-slate-100 shadow-sm p-6 max-w-xl" style={{ borderRadius: '12px', boxShadow: '0 1px 4px 0 rgba(0,0,0,0.04)' }}>
      <div className="flex items-center gap-2 mb-5">
        <div className="w-7 h-7 bg-primary-light rounded-lg flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <h2 className="font-[Manrope] font-bold text-sm text-neutral-dark">Edit Vehicle Details</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="VIN" error={formErrors.vin}><TextInput type="text" {...field('vin')} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name" error={formErrors.name}><TextInput type="text" {...field('name')} /></Field>
          <Field label="Model" error={formErrors.model}><TextInput type="text" {...field('model')} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Year" error={formErrors.year}><TextInput type="number" {...field('year')} /></Field>
          <Field label="Mileage (km)" error={formErrors.currentMileage}><TextInput type="number" {...field('currentMileage')} /></Field>
        </div>
        {updateMutation.isError && <div className="bg-red-50 border border-red-200 rounded-lg p-3"><p className="text-red-600 text-xs font-medium">Update failed. Please try again.</p></div>}
        {savedOk && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            <p className="text-green-700 text-xs font-medium">Changes saved successfully.</p>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={() => navigate({ to: '/vehicles' })} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer font-medium transition-colors">Cancel</button>
          <button type="submit" disabled={updateMutation.isPending} className="flex items-center gap-2 px-4 py-2 text-sm bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-semibold rounded-lg cursor-pointer transition-colors">
            {updateMutation.isPending ? <><svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving…</> : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Mileage Tab ─────────────────────────────────────────────────────────────

function MileageTab({ vehicle }: { vehicle: Vehicle }) {
  const qc = useQueryClient()
  const [newMileage, setNewMileage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { data: history = [] } = useQuery({
    queryKey: queryKeys.mileage.history(vehicle.id),
    queryFn: async () => ((await fetchMileageHistory(vehicle.id)).content ?? []) as MileageLog[],
  })

  const logMut = useMutation({
    mutationFn: (km: number) => log({ vehicleId: vehicle.id, newMileage: km }) as Promise<MileageLog>,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.vehicles.detail(vehicle.id) })
      qc.invalidateQueries({ queryKey: queryKeys.mileage.history(vehicle.id) })
      qc.invalidateQueries({ queryKey: queryKeys.alerts.unresolved })
      setNewMileage('')
      setSuccess(true)
      setError(null)
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to log mileage.'
      setError(msg)
      setSuccess(false)
    },
  })

  const handleLog = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const km = parseInt(newMileage)
    if (isNaN(km) || km <= 0) { setError('Enter a valid mileage value.'); return }
    logMut.mutate(km)
  }

  return (
    <div className="max-w-xl space-y-5">
      <div className="bg-white border border-slate-100 shadow-sm p-6" style={{ borderRadius: '12px' }}>
        <h3 className="font-[Manrope] font-bold text-sm text-neutral-dark mb-4">Log New Mileage</h3>
        <p className="text-xs text-slate-500 mb-4">Current: <span className="font-semibold text-neutral-dark">{vehicle.currentMileage.toLocaleString()} km</span></p>
        <form onSubmit={handleLog} className="flex gap-3">
          <TextInput
            type="number"
            value={newMileage}
            onChange={(e) => { setNewMileage(e.target.value); setSuccess(false) }}
            placeholder="New mileage (km)"
            className="flex-1"
          />
          <button type="submit" disabled={logMut.isPending} className="px-4 py-2 text-sm bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-semibold rounded-lg cursor-pointer transition-colors shrink-0">
            {logMut.isPending ? 'Saving…' : 'Save'}
          </button>
        </form>
        {error && <p className="text-red-600 text-xs mt-2">{error}</p>}
        {success && <p className="text-green-600 text-xs mt-2">Mileage updated successfully.</p>}
      </div>

      {history.length > 0 && (
        <div className="bg-white border border-slate-100 shadow-sm overflow-hidden" style={{ borderRadius: '12px' }}>
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-[Manrope] font-bold text-sm text-neutral-dark">Mileage History</h3>
          </div>
          <ul className="divide-y divide-slate-50">
            {history.map((log) => (
              <li key={log.id} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm font-semibold text-neutral-dark">{log.recordedMileage.toLocaleString()} km</span>
                <span className="text-xs text-slate-400">{new Date(log.createdAt).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ─── Consumable Parts Tab ─────────────────────────────────────────────────────

function ConsumablePartsTab({ vehicle }: { vehicle: Vehicle }) {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ConsumablePart | null>(null)
  const [form, setForm] = useState({ partName: '', lifespanKm: '', lastReplacedMileage: '', notes: '' })

  const { data: parts = [] } = useQuery({
    queryKey: queryKeys.consumables.byVehicle(vehicle.id),
    queryFn: () => listByVehicle1(vehicle.id) as Promise<ConsumablePart[]>,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.consumables.byVehicle(vehicle.id) })

  const createMut = useMutation({
    mutationFn: (data: ConsumablePartInput) => create2(data) as Promise<ConsumablePart>,
    onSuccess: () => { invalidate(); resetForm() },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ConsumablePartInput }) => update2(id, data) as Promise<ConsumablePart>,
    onSuccess: () => { invalidate(); resetForm() },
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => delete2(id),
    onSuccess: invalidate,
  })

  const resetForm = () => { setShowForm(false); setEditing(null); setForm({ partName: '', lifespanKm: '', lastReplacedMileage: '', notes: '' }) }

  const openEdit = (p: ConsumablePart) => {
    setEditing(p)
    setForm({ partName: p.partName, lifespanKm: String(p.lifespanKm), lastReplacedMileage: String(p.lastReplacedMileage), notes: p.notes ?? '' })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data: ConsumablePartInput = { vehicleId: vehicle.id, partName: form.partName, lifespanKm: parseInt(form.lifespanKm), lastReplacedMileage: parseInt(form.lastReplacedMileage), notes: form.notes || undefined }
    if (editing) { updateMut.mutate({ id: editing.id, data }) } else { createMut.mutate(data) }
  }

  const isPending = createMut.isPending || updateMut.isPending

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-[Manrope] font-bold text-sm text-neutral-dark">Consumable Parts</h3>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="text-xs font-semibold text-primary hover:text-primary-dark cursor-pointer">+ Add Part</button>
        )}
      </div>

      {showForm && (
        <div className="bg-white border border-slate-100 shadow-sm p-5" style={{ borderRadius: '12px' }}>
          <h4 className="font-semibold text-sm text-neutral-dark mb-4">{editing ? 'Edit Part' : 'New Part'}</h4>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Field label="Part Name"><TextInput type="text" value={form.partName} onChange={(e) => setForm({ ...form, partName: e.target.value })} required /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Lifespan (km)"><TextInput type="number" value={form.lifespanKm} onChange={(e) => setForm({ ...form, lifespanKm: e.target.value })} required /></Field>
              <Field label="Last Replaced At (km)"><TextInput type="number" value={form.lastReplacedMileage} onChange={(e) => setForm({ ...form, lastReplacedMileage: e.target.value })} required /></Field>
            </div>
            <Field label="Notes (optional)"><TextInput type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer font-medium">Cancel</button>
              <button type="submit" disabled={isPending} className="px-4 py-2 text-sm bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-semibold rounded-lg cursor-pointer">{isPending ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </div>
      )}

      {parts.length === 0 ? (
        <p className="text-sm text-slate-400 py-4">No consumable parts added yet.</p>
      ) : (
        <div className="bg-white border border-slate-100 shadow-sm overflow-hidden" style={{ borderRadius: '12px' }}>
          <ul className="divide-y divide-slate-50">
            {parts.map((p) => {
              const mileageSince = vehicle.currentMileage - p.lastReplacedMileage
              const pct = Math.min(100, Math.round((mileageSince / p.lifespanKm) * 100))
              return (
                <li key={p.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-neutral-dark">{p.partName}</span>
                        {p.maintenanceRequired && <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md uppercase">Overdue</span>}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">Lifespan: {p.lifespanKm.toLocaleString()} km &middot; Last replaced at {p.lastReplacedMileage.toLocaleString()} km</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button onClick={() => openEdit(p)} className="text-xs text-slate-500 hover:text-primary cursor-pointer font-medium">Edit</button>
                      <button onClick={() => deleteMut.mutate(p.id)} className="text-xs text-red-500 hover:text-red-700 cursor-pointer font-medium">Delete</button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-400' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">{mileageSince.toLocaleString()} / {p.lifespanKm.toLocaleString()} km</span>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

// ─── Legal Documents Tab ──────────────────────────────────────────────────────

const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  INSURANCE: 'Insurance',
  INSPECTION: 'Technical Inspection',
  REGISTRATION: 'Registration',
  OTHER: 'Other',
}

function LegalDocumentsTab({ vehicle }: { vehicle: Vehicle }) {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<LegalDocument | null>(null)
  const [form, setForm] = useState({ documentType: 'INSURANCE' as DocumentType, documentNumber: '', expiryDate: '', notes: '' })
  const [now] = useState(() => Date.now())

  const { data: docs = [] } = useQuery({
    queryKey: queryKeys.legalDocs.byVehicle(vehicle.id),
    queryFn: () => listByVehicle(vehicle.id) as Promise<LegalDocument[]>,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.legalDocs.byVehicle(vehicle.id) })

  const createMut = useMutation({
    mutationFn: (data: LegalDocumentInput) => create1(data) as Promise<LegalDocument>,
    onSuccess: () => { invalidate(); resetForm() },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: LegalDocumentInput }) => update1(id, data) as Promise<LegalDocument>,
    onSuccess: () => { invalidate(); resetForm() },
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => delete1(id),
    onSuccess: invalidate,
  })

  const resetForm = () => { setShowForm(false); setEditing(null); setForm({ documentType: 'INSURANCE', documentNumber: '', expiryDate: '', notes: '' }) }

  const openEdit = (d: LegalDocument) => {
    setEditing(d)
    setForm({ documentType: d.documentType, documentNumber: d.documentNumber ?? '', expiryDate: d.expiryDate, notes: d.notes ?? '' })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data: LegalDocumentInput = { vehicleId: vehicle.id, documentType: form.documentType, documentNumber: form.documentNumber || undefined, expiryDate: form.expiryDate, notes: form.notes || undefined }
    if (editing) { updateMut.mutate({ id: editing.id, data }) } else { createMut.mutate(data) }
  }

  const isPending = createMut.isPending || updateMut.isPending
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-[Manrope] font-bold text-sm text-neutral-dark">Legal Documents</h3>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="text-xs font-semibold text-primary hover:text-primary-dark cursor-pointer">+ Add Document</button>
        )}
      </div>

      {showForm && (
        <div className="bg-white border border-slate-100 shadow-sm p-5" style={{ borderRadius: '12px' }}>
          <h4 className="font-semibold text-sm text-neutral-dark mb-4">{editing ? 'Edit Document' : 'New Document'}</h4>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Field label="Document Type">
              <Select value={form.documentType} onChange={(e) => setForm({ ...form, documentType: e.target.value as DocumentType })}>
                {(Object.keys(DOC_TYPE_LABELS) as DocumentType[]).map((t) => <option key={t} value={t}>{DOC_TYPE_LABELS[t]}</option>)}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Document Number (optional)"><TextInput type="text" value={form.documentNumber} onChange={(e) => setForm({ ...form, documentNumber: e.target.value })} /></Field>
              <Field label="Expiry Date"><TextInput type="date" min={today} value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} required /></Field>
            </div>
            <Field label="Notes (optional)"><TextInput type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer font-medium">Cancel</button>
              <button type="submit" disabled={isPending} className="px-4 py-2 text-sm bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-semibold rounded-lg cursor-pointer">{isPending ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </div>
      )}

      {docs.length === 0 ? (
        <p className="text-sm text-slate-400 py-4">No legal documents added yet.</p>
      ) : (
        <div className="bg-white border border-slate-100 shadow-sm overflow-hidden" style={{ borderRadius: '12px' }}>
          <ul className="divide-y divide-slate-50">
            {docs.map((d) => {
              const daysLeft = Math.ceil((new Date(d.expiryDate).getTime() - now) / 86_400_000)
              const urgent = daysLeft <= 7
              const expired = daysLeft < 0
              return (
                <li key={d.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-neutral-dark">{DOC_TYPE_LABELS[d.documentType]}</span>
                      {expired && <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md uppercase">Expired</span>}
                      {!expired && urgent && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md uppercase">Expiring Soon</span>}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {d.documentNumber ? `No. ${d.documentNumber} · ` : ''}
                      Expires {new Date(d.expiryDate).toLocaleDateString()}
                      {!expired && ` (${daysLeft}d left)`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button onClick={() => openEdit(d)} className="text-xs text-slate-500 hover:text-primary cursor-pointer font-medium">Edit</button>
                    <button onClick={() => deleteMut.mutate(d.id)} className="text-xs text-red-500 hover:text-red-700 cursor-pointer font-medium">Delete</button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

