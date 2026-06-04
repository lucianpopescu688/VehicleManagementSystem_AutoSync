import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { list, create, _delete } from '@/api/generated/vehicle-controller/vehicle-controller'
import { CreateVehicleSchema, type CreateVehicleInput, type Vehicle } from '@/api/schemas'
import { useAuthStore } from '@/store/auth.store'
import { StatusBadge } from '@/components/StatusBadge'
import { vehicleStatusFor } from '@/lib/vehicle-status'
import { queryKeys } from '@/lib/query-keys'

export const Route = createFileRoute('/_authenticated/vehicles/')({
  component: VehiclesPage,
})

type FormState = {
  vin: string
  name: string
  model: string
  year: string
  currentMileage: string
}

const emptyForm: FormState = { vin: '', name: '', model: '', year: '', currentMileage: '' }

function VehiclesPage() {
  const role = useAuthStore((s) => s.role)
  const canManage = role === 'FLEET_MANAGER' || role === 'ADMIN' || role === 'STANDARD_USER'

  const qc = useQueryClient()
  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: queryKeys.vehicles.all,
    queryFn: async () => ((await list()).content ?? []) as Vehicle[],
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateVehicleInput) => create(data) as Promise<Vehicle>,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.vehicles.all })
      setModalOpen(false)
      setForm(emptyForm)
      setFormErrors({})
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => _delete(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.vehicles.all })
      const previousVehicles = qc.getQueryData(queryKeys.vehicles.all)
      qc.setQueryData(queryKeys.vehicles.all, (old: Vehicle[] | undefined) => 
        old?.filter((v) => v.id !== id)
      )
      return { previousVehicles }
    },
    onError: (_err, _id, context) => {
      if (context?.previousVehicles) {
        qc.setQueryData(queryKeys.vehicles.all, context.previousVehicles)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.vehicles.all })
    },
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CreateVehicleInput, string>>>({})
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleteVehicleName, setDeleteVehicleName] = useState<string>('')

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const yearParsed = parseInt(form.year, 10)
    const mileageParsed = parseFloat(form.currentMileage)
    const parsed = {
      vin: form.vin,
      name: form.name,
      model: form.model,
      year: isNaN(yearParsed) ? new Date().getFullYear() : yearParsed,
      currentMileage: isNaN(mileageParsed) ? 0 : mileageParsed,
    }
    const result = CreateVehicleSchema.safeParse(parsed)
    if (!result.success) {
      const fe: Partial<Record<keyof CreateVehicleInput, string>> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof CreateVehicleInput
        if (key) fe[key] = issue.message
      }
      setFormErrors(fe)
      return
    }
    setFormErrors({})
    createMutation.mutate(result.data)
  }

  const field = (k: keyof FormState) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value }),
  })

  const maxMileage = vehicles.length > 0 ? Math.max(...vehicles.map((v) => v.currentMileage), 1) : 1

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Fleet</p>
          <h1 className="font-[Manrope] text-2xl font-extrabold text-neutral-dark">Fleet Details</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isLoading ? 'Loading…' : `${vehicles.length} vehicle${vehicles.length !== 1 ? 's' : ''} in fleet`}
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              setForm(emptyForm)
              setFormErrors({})
              setModalOpen(true)
            }}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Vehicle
          </button>
        )}
      </div>

      {/* Table card */}
      <div
        className="bg-white border border-slate-100 shadow-sm overflow-hidden"
        style={{ borderRadius: '12px', boxShadow: '0 1px 4px 0 rgba(0,0,0,0.04)' }}
      >
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading vehicles…</div>
        ) : vehicles.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17H5a2 2 0 01-2-2V9a2 2 0 012-2h3l2-3h4l2 3h3a2 2 0 012 2v6a2 2 0 01-2 2h-4" />
                <circle cx="7.5" cy="17" r="1.5" />
                <circle cx="16.5" cy="17" r="1.5" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-500">No vehicles yet</p>
            {canManage && (
              <p className="text-xs text-slate-400 mt-1">Click "Add Vehicle" to get started.</p>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Vehicle
                </th>
                <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-5 py-3.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Mileage
                </th>
                <th className="text-right px-5 py-3.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <VehicleRow
                  key={v.id}
                  vehicle={v}
                  maxMileage={maxMileage}
                  canManage={canManage}
                  onDelete={() => {
                    setDeleteConfirmId(v.id)
                    setDeleteVehicleName(v.name)
                  }}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create modal */}
      {modalOpen && (
        <Modal
          title="Add Vehicle"
          onClose={() => {
            setModalOpen(false)
            setForm(emptyForm)
            setFormErrors({})
          }}
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <FormField label="VIN" error={formErrors.vin}>
              <input
                type="text"
                {...field('vin')}
                placeholder="17-character VIN"
                className={inputCls}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Name" error={formErrors.name}>
                <input type="text" {...field('name')} placeholder="My Truck" className={inputCls} />
              </FormField>
              <FormField label="Model" error={formErrors.model}>
                <input type="text" {...field('model')} placeholder="Ford F-150" className={inputCls} />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Year" error={formErrors.year}>
                <input type="number" {...field('year')} placeholder="2024" className={inputCls} />
              </FormField>
              <FormField label="Mileage (km)" error={formErrors.currentMileage}>
                <input type="number" {...field('currentMileage')} placeholder="0" className={inputCls} />
              </FormField>
            </div>

            {createMutation.isError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-xs">Failed to create vehicle. Please try again.</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false)
                  setForm(emptyForm)
                  setFormErrors({})
                }}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-4 py-2 text-sm bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {createMutation.isPending ? 'Saving…' : 'Save Vehicle'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirm modal */}
      {deleteConfirmId !== null && (
        <Modal title="Delete Vehicle" onClose={() => setDeleteConfirmId(null)}>
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-dark">
                Delete &ldquo;{deleteVehicleName}&rdquo;?
              </p>
              <p className="text-sm text-slate-500 mt-1">
                This action cannot be undone. The vehicle and all associated data will be permanently removed.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                deleteMutation.mutate(deleteConfirmId)
                setDeleteConfirmId(null)
              }}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-lg cursor-pointer transition-colors"
            >
              Delete Vehicle
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function VehicleRow({
  vehicle: v,
  maxMileage,
  canManage,
  onDelete,
}: {
  vehicle: Vehicle
  maxMileage: number
  canManage: boolean
  onDelete: () => void
}) {
  const status = vehicleStatusFor(v)
  const pct = Math.min(100, Math.round((v.currentMileage / maxMileage) * 100))

  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
      {/* Vehicle info */}
      <td className="px-5 py-3.5">
        <div>
          <p className="font-semibold text-neutral-dark">{v.name}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {v.model} &middot; {v.year} &middot; <span className="font-mono">{v.vin}</span>
          </p>
        </div>
      </td>

      {/* Status badge */}
      <td className="px-5 py-3.5">
        <StatusBadge status={status} />
      </td>

      {/* Mileage with progress bar */}
      <td className="px-5 py-3.5">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-700">{v.currentMileage.toLocaleString()} km</span>
          <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${pct}%`,
                backgroundColor: pct > 80 ? '#F97316' : '#0052CC',
              }}
            />
          </div>
        </div>
      </td>

      {/* Actions */}
      <td className="px-5 py-3.5">
        {canManage && (
          <div className="flex items-center gap-2 justify-end">
            <Link
              to="/vehicles/$vehicleId"
              params={{ vehicleId: String(v.id) }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-dark bg-primary-light hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </Link>
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="bg-white w-full max-w-md shadow-2xl"
        style={{ borderRadius: '16px' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-[Manrope] font-bold text-neutral-dark">{title}</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

function FormField({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

const inputCls =
  'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-neutral-dark placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0052CC] focus:border-transparent transition-colors bg-slate-50 focus:bg-white'
