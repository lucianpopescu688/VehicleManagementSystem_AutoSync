import type { Vehicle } from '@/api/types'

export type VehicleStatus = 'ACTIVE' | 'IN SERVICE' | 'NEEDS ATTENTION'

export function vehicleStatusFor(v: Vehicle): VehicleStatus {
  if (v.assignedDriverId !== null) return 'ACTIVE'
  if (v.currentMileage > 100000) return 'NEEDS ATTENTION'
  return 'IN SERVICE'
}

export function StatusBadge({ status, size = 'md' }: { status: VehicleStatus; size?: 'sm' | 'md' }) {
  const base = 'inline-flex items-center rounded-full font-semibold uppercase tracking-wide'
  const sz = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-[10px]'

  if (status === 'ACTIVE') {
    return <span className={`${base} ${sz} bg-[#E6F0FF] text-[#0052CC]`}>Active</span>
  }
  if (status === 'IN SERVICE') {
    return <span className={`${base} ${sz} bg-orange-50 text-[#F97316]`}>In Service</span>
  }
  return <span className={`${base} ${sz} bg-red-50 text-red-600`}>Needs Attention</span>
}
