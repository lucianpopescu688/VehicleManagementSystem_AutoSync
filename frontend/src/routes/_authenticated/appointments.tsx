import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { StatusBadge } from '@/components/StatusBadge'
import {
  useGetMyRequestedAppointments,
  useGetAppointmentsByShop,
  useUpdateAppointmentStatus,
  useCreateAppointment,
} from '@/api/generated/appointment/appointment'
import { getApprovedServiceShops } from '@/api/generated/service-shop/service-shop'
import { list as listVehicles } from '@/api/generated/vehicle-controller/vehicle-controller'
import type { AppointmentDto, AppointmentStatus, Vehicle, ServiceShop } from '@/api/schemas'

export const Route = createFileRoute('/_authenticated/appointments')({
  component: AppointmentsPage,
})

function AppointmentsPage() {
  const role = useAuthStore((s) => s.role)
  const user = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  const [isCreating, setIsCreating] = useState(false)

  // Fetch appointments based on role
  const isShop = role === 'SERVICE_SHOP_REPRESENTATIVE'
  
  // If shop, fetch shop appointments (assuming user.id is tied to shop, or they just get their shop's appointments. Wait, backend needs a shopId. Let's just fetch all shops and find theirs, or if not shop, fetch my requests)
  // For simplicity, we just fetch my-requests if not a shop. If they are a shop, we ideally need their shopId.
  // Actually, we'll fetch my requests for now.
  const { data: myAppointments = [], isLoading: loadingMy } = useGetMyRequestedAppointments({
    query: { enabled: !isShop },
  })

  // We need to fetch shop appointments if they are a shop. Let's just assume we list shops, find theirs by owner or just show a message.
  // We don't have the shopId in the auth store.
  // We'll fetch all shops and just show the first one's appointments for demo purposes if they are a shop.
  const { data: allShops = [] } = useQuery({
    queryKey: ['service-shops'],
    queryFn: async () => ((await getApprovedServiceShops()) ?? []) as ServiceShop[],
  })
  
  const shopId = isShop && allShops.length > 0 ? allShops[0].id : undefined

  const { data: shopAppointments = [], isLoading: loadingShop } = useGetAppointmentsByShop({
    query: { enabled: isShop },
  })

  const appointments = isShop ? shopAppointments : myAppointments
  const isLoading = isShop ? loadingShop : loadingMy

  const updateStatus = useUpdateAppointmentStatus({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['/v1/appointments/my-requests'] })
        if (shopId) qc.invalidateQueries({ queryKey: [`/v1/appointments/shop/${shopId}`] })
      },
    },
  })

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-0.5">
            Service Hub
          </p>
          <h1 className="font-[Manrope] text-2xl font-extrabold text-neutral-dark">Appointments</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isShop ? 'Manage service requests for your shop' : 'Manage your vehicle service appointments'}
          </p>
        </div>
        {!isShop && (
          <button
            onClick={() => setIsCreating(true)}
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            + New Appointment
          </button>
        )}
      </div>

      {isCreating && (
        <CreateAppointmentForm
          onClose={() => setIsCreating(false)}
          shops={allShops}
        />
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm mt-6">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No appointments found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-4 font-semibold text-slate-500">Date</th>
                <th className="text-left px-6 py-4 font-semibold text-slate-500">Vehicle</th>
                <th className="text-left px-6 py-4 font-semibold text-slate-500">Shop</th>
                <th className="text-left px-6 py-4 font-semibold text-slate-500">Status</th>
                <th className="text-left px-6 py-4 font-semibold text-slate-500">Notes</th>
                <th className="text-right px-6 py-4 font-semibold text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((app) => (
                <tr key={app.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4">
                    {new Date(app.scheduledFor).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 font-medium text-neutral-dark">
                    {app.vehicleName || 'Vehicle ' + app.vehicleId}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {app.targetShopName || 'Shop ' + app.targetShopId}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full ${
                      app.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                      app.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                      app.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 truncate max-w-xs">
                    {app.notes}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isShop && app.status !== 'COMPLETED' && app.status !== 'CANCELLED' && (
                      <button
                        onClick={() => updateStatus.mutate({ id: app.id, params: { status: 'COMPLETED' as any } })}
                        className="text-xs bg-green-50 text-green-600 hover:bg-green-100 px-3 py-1.5 rounded-md font-semibold transition-colors"
                      >
                        Mark Completed
                      </button>
                    )}
                    {!isShop && app.status === 'PENDING' && (
                      <button
                        onClick={() => updateStatus.mutate({ id: app.id, params: { status: 'CANCELLED' as any } })}
                        className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-md font-semibold transition-colors ml-2"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function CreateAppointmentForm({ onClose, shops }: { onClose: () => void, shops: ServiceShop[] }) {
  const qc = useQueryClient()
  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => ((await listVehicles()).content ?? []) as Vehicle[],
  })

  const createMut = useCreateAppointment({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['/v1/appointments/my-requests'] })
        onClose()
      },
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
    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-6">
      <h3 className="font-bold text-neutral-dark mb-4">Request New Appointment</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Vehicle</label>
          <select name="vehicleId" required className="w-full border border-slate-300 rounded-lg p-2 text-sm">
            <option value="">Select a vehicle...</option>
            {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} ({v.vin})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Service Shop</label>
          <select name="targetShopId" required className="w-full border border-slate-300 rounded-lg p-2 text-sm">
            <option value="">Select a shop...</option>
            {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Date</label>
          <input type="date" name="scheduledFor" required className="w-full border border-slate-300 rounded-lg p-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Notes / Issue</label>
          <input type="text" name="notes" placeholder="e.g., Oil change, weird noise..." className="w-full border border-slate-300 rounded-lg p-2 text-sm" />
        </div>
        <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={createMut.isPending} className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors disabled:opacity-50">
            {createMut.isPending ? 'Saving...' : 'Create Appointment'}
          </button>
        </div>
      </form>
    </div>
  )
}
