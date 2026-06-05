import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { list, create, _delete } from '@/api/generated/vehicle-controller/vehicle-controller'
import { CreateVehicleSchema, type CreateVehicleInput, type Vehicle } from '@/api/schemas'
import { useAuthStore } from '@/store/auth.store'
import { StatusBadge, Modal, Field, TextInput, PageHeader } from '@/components'
import { vehicleStatusFor } from '@/lib/vehicle-status'
import { queryKeys } from '@/lib/query-keys'

export const Route = createFileRoute('/_authenticated/vehicles/')({
  validateSearch: (search: Record<string, unknown>): { q?: string } => {
    return {
      q: (search.q as string) || undefined,
    }
  },
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
  const { q } = Route.useSearch()

  const qc = useQueryClient()
  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: queryKeys.vehicles.all,
    queryFn: async () => ((await list()).content ?? []) as Vehicle[],
  })

  const filteredVehicles = vehicles.filter((v) => {
    if (!q) return true
    const s = q.toLowerCase()
    return (
      v.name?.toLowerCase().includes(s) ||
      v.model?.toLowerCase().includes(s) ||
      v.vin?.toLowerCase().includes(s)
    )
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
      <PageHeader
        eyebrow="Fleet"
        title="Fleet Details"
        subtitle={isLoading ? 'Loading…' : `${filteredVehicles.length} vehicle${filteredVehicles.length !== 1 ? 's' : ''} found`}
        actions={
          canManage && (
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
          )
        }
      />

      {/* Grid container */}
      <div className="w-full">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <VehiclePlaceholder />
            <VehiclePlaceholder />
            <VehiclePlaceholder />
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-100 shadow-sm" style={{ boxShadow: '0 1px 4px 0 rgba(0,0,0,0.04)' }}>
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17H5a2 2 0 01-2-2V9a2 2 0 012-2h3l2-3h4l2 3h3a2 2 0 012 2v6a2 2 0 01-2 2h-4" />
                <circle cx="7.5" cy="17" r="1.5" />
                <circle cx="16.5" cy="17" r="1.5" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-500">
              {q ? `No vehicles match "${q}"` : 'No vehicles yet'}
            </p>
            {!q && canManage && (
              <p className="text-xs text-slate-400 mt-1">Click "Add Vehicle" to get started.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVehicles.map((v) => (
              <VehicleCard
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
          </div>
        )}
      </div>

      {/* Create modal */}
      {modalOpen && (
        <Modal
          open={true}
          title="Add Vehicle"
          onClose={() => {
            setModalOpen(false)
            setForm(emptyForm)
            setFormErrors({})
          }}
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <Field label="VIN" error={formErrors.vin}>
              <TextInput
                type="text"
                {...field('vin')}
                placeholder="17-character VIN"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Name" error={formErrors.name}>
                <TextInput type="text" {...field('name')} placeholder="My Truck" />
              </Field>
              <Field label="Model" error={formErrors.model}>
                <TextInput type="text" {...field('model')} placeholder="Ford F-150" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Year" error={formErrors.year}>
                <TextInput type="number" {...field('year')} placeholder="2024" />
              </Field>
              <Field label="Mileage (km)" error={formErrors.currentMileage}>
                <TextInput type="number" {...field('currentMileage')} placeholder="0" />
              </Field>
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
        <Modal open={true} title="Delete Vehicle" onClose={() => setDeleteConfirmId(null)}>
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

function VehicleCard({
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
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col hover:border-slate-200 transition-colors shadow-sm hover:shadow-md group relative"
         style={{ boxShadow: '0 2px 8px -2px rgba(0,0,0,0.05)' }}>
      {/* Top Banner (simulated placeholder image space) */}
      <div className="h-24 bg-gradient-to-br from-slate-100 to-slate-200 relative">
        <div className="absolute top-3 right-3">
          <StatusBadge status={status} />
        </div>
      </div>
      
      {/* Content */}
      <div className="px-5 pt-3 pb-5 flex flex-col flex-1">
        <h3 className="font-bold text-neutral-dark text-lg mb-0.5 truncate">{v.name}</h3>
        <p className="text-sm text-slate-500 font-medium mb-3">
          {v.year} {v.model}
        </p>
        
        <div className="flex items-center gap-2 mb-4">
          <div className="px-2 py-1 bg-slate-100 rounded text-xs font-mono text-slate-600 font-medium truncate">
            VIN: {v.vin}
          </div>
        </div>
        
        <div className="mt-auto pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Mileage</span>
            <span className="text-sm font-semibold text-neutral-dark">{v.currentMileage.toLocaleString()} km</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                backgroundColor: pct > 80 ? '#F97316' : '#0052CC',
              }}
            />
          </div>
        </div>
      </div>

      {/* Overlay Actions */}
      {canManage && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
          <Link
            to="/vehicles/$vehicleId"
            params={{ vehicleId: String(v.id) }}
            className="flex flex-col items-center gap-1.5 text-primary hover:text-primary-dark transition-colors"
          >
            <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <span className="text-xs font-bold">Edit / View</span>
          </Link>
          <button
            onClick={onDelete}
            className="flex flex-col items-center gap-1.5 text-red-500 hover:text-red-700 transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <span className="text-xs font-bold">Delete</span>
          </button>
        </div>
      )}
    </div>
  )
}

function VehiclePlaceholder() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col shadow-sm animate-pulse h-64">
      <div className="h-24 bg-slate-200" />
      <div className="p-5 flex flex-col flex-1 gap-3">
        <div className="h-6 bg-slate-200 rounded w-2/3" />
        <div className="h-4 bg-slate-100 rounded w-1/2" />
        <div className="mt-auto">
          <div className="h-4 bg-slate-100 rounded w-1/3 mb-2" />
          <div className="w-full h-1.5 bg-slate-100 rounded-full" />
        </div>
      </div>
    </div>
  )
}

