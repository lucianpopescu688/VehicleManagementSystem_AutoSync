import { api } from '@/lib/axios'
import type { Vehicle, CreateVehicleInput } from './types'

// NOTE: Once Orval is run (`npm run generate`), replace these with the generated
// TanStack Query hooks from src/api/generated/.

export async function getVehicles(): Promise<Vehicle[]> {
  const res = await api.get<{ content: Vehicle[] }>('/vehicles')
  return res.data.content
}

export async function getVehicle(id: string): Promise<Vehicle> {
  const res = await api.get<Vehicle>(`/vehicles/${id}`)
  return res.data
}

export async function createVehicle(data: CreateVehicleInput): Promise<Vehicle> {
  const res = await api.post<Vehicle>('/vehicles', data)
  return res.data
}

export async function updateVehicle(id: string, data: Partial<CreateVehicleInput>): Promise<Vehicle> {
  const res = await api.put<Vehicle>(`/vehicles/${id}`, data)
  return res.data
}

export async function deleteVehicle(id: string): Promise<void> {
  await api.delete(`/vehicles/${id}`)
}
