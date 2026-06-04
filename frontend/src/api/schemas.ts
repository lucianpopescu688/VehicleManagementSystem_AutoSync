import { z } from 'zod'
import type {
  ConsumablePartRequest,
  LegalDocumentRequest,
} from './generated/zod'
import type { Role } from '@/store/auth.store'

// ─── Re-exports from generated schemas ────────────────────────────────────────
export type { ConsumablePartRequest as ConsumablePartInput }
export type { LegalDocumentRequest as LegalDocumentInput }

export type DocumentType = 'INSURANCE' | 'INSPECTION' | 'REGISTRATION' | 'OTHER'
export type AlertType = 'WEAR' | 'EXPIRY'

// ─── Entity types (required fields for rendering) ─────────────────────────────
export interface Vehicle {
  id: string
  vin: string
  name: string
  model: string
  year: number
  currentMileage: number
  assignedDriverId: string | null
  ownerId: string | null
}

export interface MileageLog {
  id: string
  vehicleId: string
  recordedMileage: number
  recordedById: string | null
  createdAt: string
}

export interface ConsumablePart {
  id: string
  vehicleId: string
  partName: string
  lifespanKm: number
  lastReplacedMileage: number
  maintenanceRequired: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface LegalDocument {
  id: string
  vehicleId: string
  documentType: DocumentType
  documentNumber: string | null
  expiryDate: string
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface MaintenanceAlert {
  id: string
  vehicleId: string
  vehicleName: string
  alertType: AlertType
  message: string
  resolved: boolean
  resolvedAt: string | null
  createdAt: string
}

// ─── Form validation schemas ───────────────────────────────────────────────────
export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const RegisterSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum([
    'STANDARD_USER',
    'FLEET_MANAGER',
    'FLEET_DRIVER',
    'SERVICE_SHOP_REPRESENTATIVE',
  ]) satisfies z.ZodType<Exclude<Role, 'ADMIN'>>,
})

export const CreateVehicleSchema = z.object({
  vin: z
    .string()
    .min(1, 'VIN is required')
    .max(17, 'VIN must be at most 17 characters')
    .transform((v) => v.toUpperCase()),
  name: z.string().min(1, 'Name is required'),
  model: z.string().min(1, 'Model is required'),
  year: z
    .number({ error: 'Year must be a number' })
    .int()
    .min(1900, 'Year must be 1900 or later')
    .max(new Date().getFullYear() + 1, 'Year is too far in the future'),
  currentMileage: z.number({ error: 'Mileage must be a number' }).min(0),
  assignedDriverId: z.string().uuid().optional(),
})

export type LoginInput = z.infer<typeof LoginSchema>
export type RegisterInput = z.infer<typeof RegisterSchema>
export type CreateVehicleInput = z.infer<typeof CreateVehicleSchema>
