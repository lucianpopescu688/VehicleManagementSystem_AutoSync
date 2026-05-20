import type { VehicleStatus } from '@/lib/vehicle-status'

export function StatusBadge({ status, size = 'md' }: { status: VehicleStatus; size?: 'sm' | 'md' }) {
  const base = 'inline-flex items-center rounded-full font-semibold uppercase tracking-wide'
  const sz = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-[10px]'

  if (status === 'ACTIVE') {
    return <span className={`${base} ${sz} bg-primary-light text-primary`}>Active</span>
  }
  if (status === 'IN SERVICE') {
    return <span className={`${base} ${sz} bg-orange-50 text-tertiary`}>In Service</span>
  }
  return <span className={`${base} ${sz} bg-red-50 text-red-600`}>Needs Attention</span>
}
