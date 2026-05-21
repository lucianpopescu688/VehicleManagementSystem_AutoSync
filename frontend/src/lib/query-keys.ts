export const queryKeys = {
  vehicles: {
    all: ['vehicles'] as const,
    list: (params?: Record<string, unknown>) => ['vehicles', 'list', params] as const,
    detail: (id: string) => ['vehicles', id] as const,
    byOwner: (ownerId: string) => ['vehicles', 'owner', ownerId] as const,
  },
} as const
