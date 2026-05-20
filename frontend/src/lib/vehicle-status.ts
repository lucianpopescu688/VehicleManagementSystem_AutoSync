import type { Vehicle } from '@/api/schemas'

export type VehicleStatus = 'ACTIVE' | 'IN SERVICE' | 'NEEDS ATTENTION'

export function vehicleStatusFor(v: Vehicle): VehicleStatus {
  if (v.assignedDriverId !== null) return 'ACTIVE'
  if (v.currentMileage > 100000) return 'NEEDS ATTENTION'
  return 'IN SERVICE'
}
