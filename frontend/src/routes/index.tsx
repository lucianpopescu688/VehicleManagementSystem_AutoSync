import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/store/auth.store'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    const { token } = useAuthStore.getState()
    throw redirect({ to: token ? '/dashboard' : '/login' })
  },
})
