import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { list as listVehicles } from '@/api/generated/vehicle-controller/vehicle-controller'
import { getUnresolved } from '@/api/generated/alert-controller/alert-controller'
import type { Vehicle, MaintenanceAlert } from '@/api/schemas'
import { vehicleStatusFor } from '@/lib/vehicle-status'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'

export const Route = createFileRoute('/_authenticated/analytics')({
  component: AnalyticsPage,
})

const STATUS_COLORS: Record<string, string> = {
  active: '#10B981', // green
  maintenance: '#F59E0B', // amber
  inactive: '#94A3B8', // slate
}

function AnalyticsPage() {
  const { data: vehicles = [], isLoading: isLoadingVehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => ((await listVehicles()).content ?? []) as Vehicle[],
  })

  const { data: alerts = [], isLoading: isLoadingAlerts } = useQuery({
    queryKey: ['alerts', 'unresolved'],
    queryFn: async () => (await getUnresolved()) as MaintenanceAlert[],
  })

  if (isLoadingVehicles || isLoadingAlerts) {
    return <div className="p-8 text-slate-400">Loading analytics data...</div>
  }

  // Process data for charts
  
  // 1. Status Distribution
  const statusCounts = { active: 0, maintenance: 0, inactive: 0 }
  vehicles.forEach(v => {
    const st = vehicleStatusFor(v)
    if (statusCounts[st] !== undefined) statusCounts[st]++
  })
  const statusData = [
    { name: 'Active', value: statusCounts.active, color: STATUS_COLORS.active },
    { name: 'Maintenance', value: statusCounts.maintenance, color: STATUS_COLORS.maintenance },
    { name: 'Inactive', value: statusCounts.inactive, color: STATUS_COLORS.inactive },
  ].filter(d => d.value > 0)

  // 2. Mileage Chart Data (Top 10 highest mileage)
  const mileageData = [...vehicles]
    .sort((a, b) => b.currentMileage - a.currentMileage)
    .slice(0, 10)
    .map(v => ({
      name: v.name,
      mileage: v.currentMileage,
      vin: v.vin
    }))

  // 3. Alerts Distribution
  const alertTypes = { WEAR: 0, EXPIRY: 0, OTHER: 0 }
  alerts.forEach(a => {
    if (a.alertType === 'WEAR') alertTypes.WEAR++
    else if (a.alertType === 'EXPIRY') alertTypes.EXPIRY++
    else alertTypes.OTHER++
  })
  const alertData = [
    { name: 'Wear & Tear', value: alertTypes.WEAR, color: '#EF4444' }, // red
    { name: 'Document Expiry', value: alertTypes.EXPIRY, color: '#F59E0B' }, // amber
  ].filter(d => d.value > 0)

  return (
    <div className="p-8">
      <div className="mb-6">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-0.5">
          Intelligence
        </p>
        <h1 className="font-[Manrope] text-2xl font-extrabold text-neutral-dark">Fleet Analytics</h1>
        <p className="text-sm text-slate-500 mt-0.5">Visual insights into your fleet's health and operations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm" style={{ borderRadius: '12px' }}>
          <h3 className="font-[Manrope] font-bold text-sm text-neutral-dark mb-4">Vehicle Status Distribution</h3>
          <div className="h-64">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">No vehicles</div>
            )}
          </div>
        </div>

        {/* Alerts Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm" style={{ borderRadius: '12px' }}>
          <h3 className="font-[Manrope] font-bold text-sm text-neutral-dark mb-4">Active Alerts by Type</h3>
          <div className="h-64">
            {alertData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={alertData}
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {alertData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-slate-500 text-sm font-medium">All clear! No active alerts.</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Mileage Bar Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2" style={{ borderRadius: '12px' }}>
          <h3 className="font-[Manrope] font-bold text-sm text-neutral-dark mb-4">Top Vehicles by Mileage (km)</h3>
          <div className="h-80">
            {mileageData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mileageData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                  <Tooltip 
                    cursor={{ fill: '#F1F5F9' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="mileage" fill="#0052CC" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">No data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
