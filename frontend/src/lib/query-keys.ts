export const queryKeys = {
  vehicles: {
    all: ['vehicles'] as const,
    list: (params?: Record<string, unknown>) => ['vehicles', 'list', params] as const,
    detail: (id: string) => ['vehicles', id] as const,
    byOwner: (ownerId: string) => ['vehicles', 'owner', ownerId] as const,
  },
  mileage: {
    history: (vehicleId: string) => ['mileage', vehicleId, 'history'] as const,
  },
  consumables: {
    byVehicle: (vehicleId: string) => ['consumables', vehicleId] as const,
  },
  legalDocs: {
    byVehicle: (vehicleId: string) => ['legal-docs', vehicleId] as const,
  },
  alerts: {
    unresolved: ['alerts', 'unresolved'] as const,
    byVehicle: (vehicleId: string) => ['alerts', vehicleId] as const,
  },
} as const
