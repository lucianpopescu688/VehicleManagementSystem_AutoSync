import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { getUnresolved, resolve } from '@/api/generated/alert-controller/alert-controller'
import type { MaintenanceAlert, AlertType } from '@/api/schemas'
import { StatCard, PageHeader } from '@/components'

export const Route = createFileRoute('/_authenticated/alerts')({
  component: AlertsPage,
})

const ALERT_TYPE_LABEL: Record<AlertType, string> = {
  WEAR: 'Wear',
  EXPIRY: 'Expiry',
}

function AlertsPage() {
  const qc = useQueryClient()

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: queryKeys.alerts.unresolved,
    queryFn: async () => (await getUnresolved()) as MaintenanceAlert[],
    refetchInterval: 60_000,
  })

  const resolveMutation = useMutation({
    mutationFn: (id: string) => resolve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.alerts.unresolved }),
  })

  const wearAlerts = alerts.filter((a) => a.alertType === 'WEAR')
  const expiryAlerts = alerts.filter((a) => a.alertType === 'EXPIRY')

  return (
    <div className="p-8">
      <PageHeader
        eyebrow="Maintenance"
        title="Alerts"
        subtitle="Active maintenance and document expiry alerts"
      />

      {isLoading ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading alerts…
        </div>
      ) : alerts.length === 0 ? (
        <div
          className="bg-white border border-slate-100 shadow-sm p-12 text-center max-w-md"
          style={{ borderRadius: '12px' }}
        >
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-700 mb-1">All clear</p>
          <p className="text-xs text-slate-400">No active maintenance alerts for your fleet.</p>
        </div>
      ) : (
        <div className="space-y-6 max-w-2xl">
          {/* Summary row */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              label="Wear Alerts"
              value={String(wearAlerts.length)}
              accent="#EF4444"
              accentBg="#FEF2F2"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
            />
            <StatCard
              label="Expiry Alerts"
              value={String(expiryAlerts.length)}
              accent="#F59E0B"
              accentBg="#FFFBEB"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
          </div>

          {/* Alert list */}
          <div
            className="bg-white border border-slate-100 shadow-sm overflow-hidden"
            style={{ borderRadius: '12px', boxShadow: '0 1px 4px 0 rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-[Manrope] font-bold text-sm text-neutral-dark">
                Active Alerts ({alerts.length})
              </h2>
              <button
                onClick={() => alerts.forEach((a) => resolveMutation.mutate(a.id))}
                disabled={resolveMutation.isPending}
                className="text-xs font-semibold text-slate-400 hover:text-red-500 cursor-pointer disabled:opacity-50 transition-colors"
              >
                Dismiss all
              </button>
            </div>
            <ul className="divide-y divide-slate-50">
              {alerts.map((alert: MaintenanceAlert) => (
                <AlertRow
                  key={alert.id}
                  alert={alert}
                  onResolve={() => resolveMutation.mutate(alert.id)}
                  isPending={resolveMutation.isPending}
                />
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

function AlertRow({
  alert,
  onResolve,
  isPending,
}: {
  alert: MaintenanceAlert
  onResolve: () => void
  isPending: boolean
}) {
  const isWear = alert.alertType === 'WEAR'

  return (
    <li className="flex items-start justify-between gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
      <div className="flex items-start gap-3 min-w-0">
        <div
          className="mt-0.5 shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: isWear ? '#FEF2F2' : '#FFFBEB' }}
        >
          {isWear ? (
            <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to="/vehicles/$vehicleId"
              params={{ vehicleId: alert.vehicleId }}
              className="font-semibold text-sm text-neutral-dark hover:text-primary transition-colors"
            >
              {alert.vehicleName}
            </Link>
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase"
              style={{
                color: isWear ? '#DC2626' : '#D97706',
                backgroundColor: isWear ? '#FEF2F2' : '#FFFBEB',
              }}
            >
              {ALERT_TYPE_LABEL[alert.alertType]}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{alert.message}</p>
          <p className="text-[10px] text-slate-300 mt-0.5">
            {new Date(alert.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>
      <button
        onClick={onResolve}
        disabled={isPending}
        className="shrink-0 text-xs font-semibold text-slate-400 hover:text-green-600 cursor-pointer disabled:opacity-50 transition-colors mt-0.5"
      >
        Resolve
      </button>
    </li>
  )
}

