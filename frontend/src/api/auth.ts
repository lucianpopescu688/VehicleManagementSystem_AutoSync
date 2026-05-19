import { api } from '@/lib/axios'
import type { LoginInput, RegisterInput } from './types'

export interface AuthResponse {
  token: string
}

/** Decode a JWT payload without verifying the signature (browser-side only). */
export function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return {}
  }
}

export async function login(data: LoginInput): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/auth/authenticate', data)
  return res.data
}

export async function register(data: RegisterInput): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/auth/register', data)
  return res.data
}
