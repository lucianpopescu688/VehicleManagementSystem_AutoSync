import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import {
  Button,
  Card,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  Select,
  Spinner,
  TextArea,
  TextInput,
  useToast,
} from '@/components'
import {
  useGetMyRequestedAppointments,
  useGetAppointmentsByShop,
  useUpdateAppointmentStatus,
  useCreateAppointment,
  useCompleteAppointment,
  getGetMyRequestedAppointmentsQueryKey,
  getGetAppointmentsByShopQueryKey,
} from '@/api/generated/appointment/appointment'
import { getApprovedServiceShops } from '@/api/generated/service-shop/service-shop'
import { list as listVehicles } from '@/api/generated/vehicle-controller/vehicle-controller'
import type { AppointmentDto, ServiceShopDto } from '@/api/generated/zod'
import type { Vehicle } from '@/api/schemas'

export const Route = createFileRoute('/_authenticated/appointments')({
  component: AppointmentsPage,
})

type AppointmentStatus = NonNullable<AppointmentDto['status']>

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  REJECTED: 'bg-red-100 text-red-700',
  ACCEPTED: 'bg-blue-100 text-blue-700',
  PENDING: 'bg-amber-100 text-amber-700',
}

function StatusPill({ status }: { status?: AppointmentStatus }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${STATUS_STYLES[status ?? 'PENDING'] ?? 'bg-slate-100 text-slate-600'}`}
    >
      {status}
    </span>
  )
}

function AppointmentsPage() {
  const role = useAuthStore((s) => s.role)
  const qc = useQueryClient()
  const toast = useToast()
  const [isCreating, setIsCreating] = useState(false)
  const [completing, setCompleting] = useState<AppointmentDto | null>(null)

  const isShop = role === 'SERVICE_SHOP_REPRESENTATIVE'

  // Near-real-time: poll every 10s so reps see new requests and owners see
  // completions without a manual refresh. (No WebSocket/SSE yet — see FINALPLAN Part 11.)
  const POLL_MS = 10_000
  const { data: myAppointments = [], isLoading: loadingMy } = useGetMyRequestedAppointments({
    query: { enabled: !isShop, refetchInterval: POLL_MS },
  })
  const { data: shopAppointments = [], isLoading: loadingShop } = useGetAppointmentsByShop({
    query: { enabled: isShop, refetchInterval: POLL_MS },
  })

  const appointments = isShop ? shopAppointments : myAppointments
  const isLoading = isShop ? loadingShop : loadingMy

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getGetMyRequestedAppointmentsQueryKey() })
    qc.invalidateQueries({ queryKey: getGetAppointmentsByShopQueryKey() })
  }

  const updateStatus = useUpdateAppointmentStatus({
    mutation: {
      onSuccess: () => {
        invalidate()
        toast.success('Appointment updated')
      },
      onError: () => toast.error('Failed to update appointment'),
    },
  })

  return (
    <div className="p-8">
      <PageHeader
        eyebrow="Service Hub"
        title="Appointments"
        subtitle={
          isShop ? 'Manage service requests for your shop' : 'Manage your vehicle service appointments'
        }
        actions={
          !isShop ? <Button onClick={() => setIsCreating(true)}>+ New Appointment</Button> : undefined
        }
      />

      <Card padded={false} className="overflow-hidden">
        {isLoading ? (
          <Spinner label="Loading appointments..." />
        ) : appointments.length === 0 ? (
          <EmptyState
            title="No appointments yet"
            description={
              isShop
                ? 'Service requests assigned to your shop will appear here.'
                : 'Create an appointment to schedule a service visit.'
            }
            action={!isShop ? <Button onClick={() => setIsCreating(true)}>+ New Appointment</Button> : undefined}
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-4 text-left font-semibold text-slate-500">Date</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-500">Vehicle</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-500">Shop</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-500">Status</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-500">Notes</th>
                <th className="px-6 py-4 text-right font-semibold text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((app) => (
                <tr key={app.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4">
                    {app.scheduledFor ? new Date(app.scheduledFor).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 font-medium text-neutral-dark">
                    {app.vehicleName ?? 'Vehicle ' + app.vehicleId}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {app.targetShopName ?? 'Shop ' + app.targetShopId}
                  </td>
                  <td className="px-6 py-4">
                    <StatusPill status={app.status} />
                  </td>
                  <td className="max-w-xs truncate px-6 py-4 text-slate-500">{app.notes}</td>
                  <td className="px-6 py-4 text-right">
                    {isShop && app.status !== 'COMPLETED' && app.status !== 'CANCELLED' && (
                      <Button size="sm" onClick={() => setCompleting(app)}>
                        Complete Service
                      </Button>
                    )}
                    {!isShop && app.status === 'PENDING' && (
                      <Button
                        size="sm"
                        variant="danger"
                        loading={updateStatus.isPending}
                        onClick={() =>
                          updateStatus.mutate({ id: app.id!, params: { status: 'CANCELLED' } })
                        }
                      >
                        Cancel
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {isCreating && <CreateAppointmentForm onClose={() => setIsCreating(false)} onSaved={invalidate} />}
      {completing && (
        <CompleteAppointmentModal
          appointment={completing}
          onClose={() => setCompleting(null)}
          onSaved={invalidate}
        />
      )}
    </div>
  )
}

function CreateAppointmentForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const toast = useToast()
  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => ((await listVehicles()).content ?? []) as Vehicle[],
  })
  const { data: shops = [] } = useQuery({
    queryKey: ['service-shops', 'approved'],
    queryFn: async () => ((await getApprovedServiceShops()) ?? []) as ServiceShopDto[],
  })

  const createMut = useCreateAppointment({
    mutation: {
      onSuccess: () => {
        toast.success('Appointment created')
        onSaved()
        onClose()
      },
      onError: () => toast.error('Failed to create appointment'),
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    createMut.mutate({
      data: {
        vehicleId: fd.get('vehicleId') as string,
        targetShopId: fd.get('targetShopId') as string,
        scheduledFor: new Date(fd.get('scheduledFor') as string).toISOString(),
        notes: fd.get('notes') as string,
      },
    })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Request New Appointment"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="create-appointment-form" loading={createMut.isPending}>
            Create Appointment
          </Button>
        </>
      }
    >
      <form id="create-appointment-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Vehicle" htmlFor="vehicleId">
          <Select id="vehicleId" name="vehicleId" required>
            <option value="">Select a vehicle...</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.vin})
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Service Shop" htmlFor="targetShopId">
          <Select id="targetShopId" name="targetShopId" required>
            <option value="">Select a shop...</option>
            {shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Date" htmlFor="scheduledFor">
          <TextInput id="scheduledFor" type="date" name="scheduledFor" required />
        </Field>
        <Field label="Notes / Issue" htmlFor="notes">
          <TextInput id="notes" type="text" name="notes" placeholder="e.g., Oil change, weird noise..." />
        </Field>
      </form>
    </Modal>
  )
}

function CompleteAppointmentModal({
  appointment,
  onClose,
  onSaved,
}: {
  appointment: AppointmentDto
  onClose: () => void
  onSaved: () => void
}) {
  const toast = useToast()
  const completeMut = useCompleteAppointment({
    mutation: {
      onSuccess: () => {
        toast.success('Service completed — owner notified, parts & alerts reset')
        onSaved()
        onClose()
      },
      onError: () => toast.error('Failed to complete service'),
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const mileage = fd.get('recordedMileage') as string
    const cost = fd.get('totalCost') as string
    completeMut.mutate({
      id: appointment.id!,
      data: {
        recordedMileage: mileage ? Number(mileage) : undefined,
        totalCost: cost ? Number(cost) : undefined,
        mechanicNotes: (fd.get('mechanicNotes') as string) || undefined,
      },
    })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Complete Service — ${appointment.vehicleName ?? 'Vehicle'}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="complete-appointment-form" loading={completeMut.isPending}>
            Complete Service
          </Button>
        </>
      }
    >
      <p className="mb-4 text-sm text-slate-500">
        Completing resets all parts needing maintenance, resolves open alerts on this vehicle, and emails
        the owner.
      </p>
      <form id="complete-appointment-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Recorded Mileage (km)" htmlFor="recordedMileage">
          <TextInput id="recordedMileage" type="number" name="recordedMileage" min={0} placeholder="e.g., 85000" />
        </Field>
        <Field label="Total Cost" htmlFor="totalCost">
          <TextInput id="totalCost" type="number" name="totalCost" min={0} step="0.01" placeholder="e.g., 249.99" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Mechanic Notes" htmlFor="mechanicNotes">
            <TextArea id="mechanicNotes" name="mechanicNotes" rows={3} placeholder="Work performed..." />
          </Field>
        </div>
      </form>
    </Modal>
  )
}
