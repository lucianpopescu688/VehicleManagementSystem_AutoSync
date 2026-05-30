import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { list } from '@/api/generated/vehicle-controller/vehicle-controller'
import type { Vehicle } from '@/api/schemas'
import { useAuthStore } from '@/store/auth.store'
import { StatusBadge } from '@/components/StatusBadge'
import { vehicleStatusFor } from '@/lib/vehicle-status'
import { queryKeys } from '@/lib/query-keys'
import { getUnresolved, resolve } from '@/api/generated/alert-controller/alert-controller'
import type { MaintenanceAlert } from '@/api/schemas'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
})

const roleLabelMap: Record<string, string> = {
  ADMIN: 'Admin',
  FLEET_MANAGER: 'Fleet Manager',
  FLEET_DRIVER: 'Fleet Driver',
  SERVICE_SHOP_REPRESENTATIVE: 'Service Shop Rep',
  STANDARD_USER: 'Standard User',
}

function DashboardPage() {
  const role = useAuthStore((s) => s.role)
  const qc = useQueryClient()

  const { data: vehicles, isLoading } = useQuery({
    queryKey: queryKeys.vehicles.all,
    queryFn: async () => ((await list()).content ?? []) as Vehicle[],
  })

  const { data: alerts = [] } = useQuery({
    queryKey: queryKeys.alerts.unresolved,
    queryFn: async () => (await getUnresolved()) as MaintenanceAlert[],
    refetchInterval: 60_000,
  })

  const resolveMutation = useMutation({
    mutationFn: (id: string) => resolve(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.alerts.unresolved })
      const previousAlerts = qc.getQueryData(queryKeys.alerts.unresolved)
      qc.setQueryData(queryKeys.alerts.unresolved, (old: MaintenanceAlert[] | undefined) => 
        old?.filter((a) => a.id !== id)
      )
      return { previousAlerts }
    },
    onError: (_err, _id, context) => {
      if (context?.previousAlerts) {
        qc.setQueryData(queryKeys.alerts.unresolved, context.previousAlerts)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.alerts.unresolved })
    },
  })

  const total = vehicles?.length ?? 0
  const fleetMileage = vehicles?.reduce((sum, v) => sum + v.currentMileage, 0) ?? 0
  const assigned = vehicles?.filter((v) => v.assignedDriverId !== null).length ?? 0
  const previewVehicles = vehicles?.slice(0, 5) ?? []

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-0.5">
          {role ? (roleLabelMap[role] ?? role) : 'Dashboard'}
        </p>
        <h1 className="font-[Manrope] text-2xl font-extrabold text-neutral-dark">Kinetic Engine</h1>
        <p className="text-sm text-slate-500 mt-0.5">Fleet Overview &amp; Management</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Vehicles"
          value={isLoading ? '…' : String(total)}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17H5a2 2 0 01-2-2V9a2 2 0 012-2h3l2-3h4l2 3h3a2 2 0 012 2v6a2 2 0 01-2 2h-4" />
              <circle cx="7.5" cy="17" r="1.5" />
              <circle cx="16.5" cy="17" r="1.5" />
            </svg>
          }
          accent="#0052CC"
          accentBg="#E6F0FF"
        />
        <StatCard
          title="Fleet Mileage"
          value={isLoading ? '…' : `${fleetMileage.toLocaleString()} km`}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          }
          accent="#0052CC"
          accentBg="#E6F0FF"
        />
        <StatCard
          title="Assigned"
          value={isLoading ? '…' : String(assigned)}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
          accent="#0052CC"
          accentBg="#E6F0FF"
        />
        <StatCard
          title="Active Alerts"
          value={String(alerts.length)}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
          accent="#F97316"
          accentBg="#FFF7ED"
        />
      </div>

      {/* Alerts banner */}
      {alerts.length > 0 && (
        <div className="mb-6 bg-orange-50 border border-orange-200 rounded-xl overflow-hidden" style={{ borderRadius: '12px' }}>
          <div className="flex items-center gap-2 px-5 py-3 border-b border-orange-200 bg-orange-100">
            <svg className="w-4 h-4 text-orange-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-sm font-bold text-orange-800">Maintenance Alerts ({alerts.length})</h3>
          </div>
          <ul className="divide-y divide-orange-100">
            {alerts.map((alert: MaintenanceAlert) => (
              <li key={alert.id} className="flex items-start justify-between gap-4 px-5 py-3">
                <div className="flex items-start gap-2 min-w-0">
                  <span className={`mt-0.5 shrink-0 inline-block w-2 h-2 rounded-full ${alert.alertType === 'WEAR' ? 'bg-red-500' : 'bg-amber-500'}`} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-orange-900">{alert.vehicleName}</p>
                    <p className="text-xs text-orange-700 mt-0.5">{alert.message}</p>
                  </div>
                </div>
                <button
                  onClick={() => resolveMutation.mutate(alert.id)}
                  disabled={resolveMutation.isPending}
                  className="shrink-0 text-xs font-semibold text-orange-600 hover:text-orange-800 cursor-pointer disabled:opacity-50"
                >
                  Dismiss
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Fleet Inventory mini-table — left 3/5 */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden" style={{ borderRadius: '12px' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="font-[Manrope] font-bold text-sm text-neutral-dark">Fleet Inventory</h2>
              <p className="text-xs text-slate-400 mt-0.5">Recent vehicles</p>
            </div>
            <Link
              to="/vehicles"
              className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors"
            >
              View All Vehicles →
            </Link>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading…</div>
          ) : previewVehicles.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No vehicles yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Vehicle</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Mileage</th>
                </tr>
              </thead>
              <tbody>
                {previewVehicles.map((v) => {
                  const status = vehicleStatusFor(v)
                  const maxMileage = 200000
                  const pct = Math.min(100, Math.round((v.currentMileage / maxMileage) * 100))
                  return (
                    <tr key={v.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-neutral-dark text-sm">{v.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{v.model} &middot; #{v.id}</p>
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={status} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500">{v.currentMileage.toLocaleString()}</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Right column — 2/5 */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Quick Actions dark panel */}
          <div className="bg-neutral-dark rounded-xl p-5" style={{ borderRadius: '12px' }}>
            <h2 className="font-[Manrope] font-bold text-sm text-white mb-1">Quick Actions</h2>
            <p className="text-[11px] text-slate-400 mb-4">Manage your fleet</p>

            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/vehicles"
                className="flex flex-col items-center justify-center gap-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg py-3 px-2 transition-colors cursor-pointer text-center"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs font-semibold">Add Vehicle</span>
              </Link>

              <button
                disabled
                className="flex flex-col items-center justify-center gap-1.5 bg-slate-800 text-slate-500 rounded-lg py-3 px-2 cursor-not-allowed text-center"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-xs font-semibold">Drivers</span>
              </button>

              <button
                disabled
                className="flex flex-col items-center justify-center gap-1.5 bg-slate-800 text-slate-500 rounded-lg py-3 px-2 cursor-not-allowed text-center"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span className="text-xs font-semibold">Fuel Logs</span>
              </button>

              <button
                disabled
                className="flex flex-col items-center justify-center gap-1.5 bg-slate-800 text-slate-500 rounded-lg py-3 px-2 cursor-not-allowed text-center"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs font-semibold">Schedule</span>
              </button>
            </div>
          </div>

          {/* Export button */}
          <button className="w-full bg-white border border-slate-200 hover:border-[#0052CC] hover:text-primary text-slate-600 rounded-xl py-3 text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2" style={{ borderRadius: '12px' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Data
          </button>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  accent,
  accentBg,
}: {
  title: string
  value: string
  icon: React.ReactNode
  accent: string
  accentBg: string
}) {
  return (
    <div
      className="bg-white border border-slate-100 p-5 shadow-sm"
      style={{ borderRadius: '12px', boxShadow: '0 1px 4px 0 rgba(0,0,0,0.04)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: accentBg, color: accent }}
        >
          {icon}
        </div>
      </div>
      <p
        className="text-2xl font-[Manrope] font-extrabold"
        style={{ color: accent === '#F97316' ? '#0F172A' : '#0F172A' }}
      >
        {value}
      </p>
    </div>
  )
}
