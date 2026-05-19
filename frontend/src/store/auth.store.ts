import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Role =
  | 'STANDARD_USER'
  | 'FLEET_MANAGER'
  | 'FLEET_DRIVER'
  | 'SERVICE_SHOP_REPRESENTATIVE'
  | 'ADMIN'

interface AuthState {
  token: string | null
  email: string | null
  role: Role | null
  login: (token: string, email: string, role: Role | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      email: null,
      role: null,
      login: (token, email, role) => set({ token, email, role }),
      logout: () => set({ token: null, email: null, role: null }),
    }),
    { name: 'fm-auth' },
  ),
)
