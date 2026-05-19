import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { getVehicle, updateVehicle } from '@/api/vehicles'
import { CreateVehicleSchema, type CreateVehicleInput, type Vehicle } from '@/api/types'

export const Route = createFileRoute('/_authenticated/vehicles/$vehicleId')({
  component: VehicleDetailPage,
})

function VehicleDetailPage() {
  const { vehicleId } = Route.useParams()
  const navigate = useNavigate()
  const id = parseInt(vehicleId)

  const { data: vehicle, isLoading, isError } = useQuery({
    queryKey: ['vehicles', id],
    queryFn: () => getVehicle(id),
    enabled: !isNaN(id),
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
        <div
          className="bg-white border border-slate-100 p-8 text-center max-w-md"
          style={{ borderRadius: '12px' }}
        >
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-700 mb-1">Vehicle not found</p>
          <p className="text-xs text-slate-400 mb-4">The vehicle you&apos;re looking for doesn&apos;t exist or was removed.</p>
          <button
            onClick={() => navigate({ to: '/vehicles' })}
            className="text-sm font-semibold text-[#0052CC] hover:text-[#003d99] cursor-pointer"
          >
            ← Back to Fleet Details
          </button>
        </div>
      </div>
    )
  }

  return <EditVehicleForm vehicle={vehicle} />
}

type FormState = {
  vin: string
  name: string
  model: string
  year: string
  currentMileage: string
}

function vehicleToForm(v: Vehicle): FormState {
  return {
    vin: v.vin,
    name: v.name,
    model: v.model,
    year: String(v.year),
    currentMileage: String(v.currentMileage),
  }
}

function EditVehicleForm({ vehicle }: { vehicle: Vehicle }) {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [form, setForm] = useState<FormState>(() => vehicleToForm(vehicle))
  const [formErrors, setFormErrors] = useState<Partial<Record<string, string>>>({})
  const [savedOk, setSavedOk] = useState(false)

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateVehicleInput>) => updateVehicle(vehicle.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicles'] })
      setSavedOk(true)
    },
    onError: () => {
      setSavedOk(false)
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSavedOk(false)
    const parsed = {
      vin: form.vin,
      name: form.name,
      model: form.model,
      year: parseInt(form.year),
      currentMileage: parseFloat(form.currentMileage),
    }
    const result = CreateVehicleSchema.safeParse(parsed)
    if (!result.success) {
      const fe: Partial<Record<string, string>> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string
        if (key) fe[key] = issue.message
      }
      setFormErrors(fe)
      return
    }
    setFormErrors({})
    updateMutation.mutate(result.data)
  }

  const field = (k: keyof FormState) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm({ ...form, [k]: e.target.value })
      setSavedOk(false)
    },
  })

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-4">
        <Link
          to="/vehicles"
          className="text-slate-400 hover:text-[#0052CC] transition-colors font-medium"
        >
          Fleet Details
        </Link>
        <svg className="w-3.5 h-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-slate-600 font-medium">{vehicle.name}</span>
      </nav>

      {/* Page title */}
      <div className="mb-6">
        <h1 className="font-[Manrope] text-2xl font-extrabold text-[#0F172A]">{vehicle.name}</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          {vehicle.model} &middot; {vehicle.year} &middot; <span className="font-mono text-xs">{vehicle.vin}</span>
        </p>
      </div>

      {/* Edit form card */}
      <div
        className="bg-white border border-slate-100 shadow-sm p-6 max-w-xl"
        style={{ borderRadius: '12px', boxShadow: '0 1px 4px 0 rgba(0,0,0,0.04)' }}
      >
        <div className="flex items-center gap-2 mb-5">
          <div className="w-7 h-7 bg-[#E6F0FF] rounded-lg flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-[#0052CC]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h2 className="font-[Manrope] font-bold text-sm text-[#0F172A]">Edit Vehicle Details</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="VIN" error={formErrors.vin}>
            <input type="text" {...field('vin')} className={inputCls} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" error={formErrors.name}>
              <input type="text" {...field('name')} className={inputCls} />
            </Field>
            <Field label="Model" error={formErrors.model}>
              <input type="text" {...field('model')} className={inputCls} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Year" error={formErrors.year}>
              <input type="number" {...field('year')} className={inputCls} />
            </Field>
            <Field label="Mileage (km)" error={formErrors.currentMileage}>
              <input type="number" {...field('currentMileage')} className={inputCls} />
            </Field>
          </div>

          {updateMutation.isError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-xs font-medium">Update failed. Please try again.</p>
            </div>
          )}

          {savedOk && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-green-700 text-xs font-medium">Changes saved successfully.</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => navigate({ to: '/vehicles' })}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-[#0052CC] hover:bg-[#003d99] disabled:opacity-50 text-white font-semibold rounded-lg cursor-pointer transition-colors"
            >
              {updateMutation.isPending ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving…
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({
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
  'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0052CC] focus:border-transparent transition-colors bg-slate-50 focus:bg-white'
