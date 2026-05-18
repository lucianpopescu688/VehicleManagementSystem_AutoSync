import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { login, decodeJwtPayload } from '@/api/auth'
import { LoginSchema } from '@/api/types'
import { useAuthStore } from '@/store/auth.store'
import type { Role } from '@/store/auth.store'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function FleetMasterLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 bg-[#0052CC] rounded-lg flex items-center justify-center flex-shrink-0">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="2" y="2" width="3" height="3" rx="0.5" fill="white" />
          <rect x="7" y="2" width="3" height="3" rx="0.5" fill="white" />
          <rect x="12" y="2" width="6" height="3" rx="0.5" fill="white" />
          <rect x="2" y="7" width="6" height="3" rx="0.5" fill="white" />
          <rect x="11" y="7" width="3" height="3" rx="0.5" fill="white" />
          <rect x="2" y="12" width="3" height="6" rx="0.5" fill="white" />
          <rect x="7" y="12" width="3" height="3" rx="0.5" fill="white" />
          <rect x="12" y="15" width="6" height="3" rx="0.5" fill="white" />
        </svg>
      </div>
      <div>
        <div className="font-[Manrope] font-extrabold text-sm leading-tight text-white">FLEET MASTER</div>
        <div className="font-[Inter] text-[10px] text-slate-400 tracking-widest leading-tight">PRECISION CONTROL</div>
      </div>
    </div>
  )
}

function LoginPage() {
  const navigate = useNavigate()
  const storeLogin = useAuthStore((s) => s.login)
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Partial<typeof form>>({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setServerError('')

    const result = LoginSchema.safeParse(form)
    if (!result.success) {
      const fe: Partial<typeof form> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof typeof form
        if (key) fe[key] = issue.message
      }
      setErrors(fe)
      return
    }
    setErrors({})
    setLoading(true)

    try {
      const data = await login(result.data)
      const payload = decodeJwtPayload(data.token)
      const email = typeof payload.sub === 'string' ? payload.sub : form.email
      const role = (payload.role ?? null) as Role | null
      storeLogin(data.token, email, role)
      navigate({ to: '/dashboard' })
    } catch {
      setServerError('Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — dark navy branding, 45% */}
      <div
        className="hidden lg:flex lg:w-[45%] flex-col justify-between p-10 relative overflow-hidden"
        style={{ backgroundColor: '#0F172A' }}
      >
        {/* Background decoration */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 20% 50%, rgba(0,82,204,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(249,115,22,0.08) 0%, transparent 50%)',
          }}
        />

        {/* Top: logo */}
        <div className="relative">
          <FleetMasterLogo />
        </div>

        {/* Center: tagline */}
        <div className="relative">
          <h2 className="font-[Manrope] text-3xl font-extrabold text-white leading-tight mb-4">
            Drive Efficiency.<br />Manage Everything.
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            Fleet Master gives you complete visibility and control over your entire vehicle fleet — from mileage tracking to driver assignment.
          </p>

          {/* Feature bullets */}
          <div className="mt-8 space-y-3">
            {[
              'Real-time fleet tracking',
              'Driver assignment & management',
              'Service scheduling & alerts',
              'Comprehensive analytics',
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#0052CC] flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-slate-300">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: version note */}
        <div className="relative">
          <p className="text-xs text-slate-600">Fleet Master &copy; {new Date().getFullYear()} &mdash; Precision Control</p>
        </div>
      </div>

      {/* Right panel — white form, 55% */}
      <div className="flex-1 lg:w-[55%] bg-white flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-[#0052CC] rounded-lg flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="2" y="2" width="3" height="3" rx="0.5" fill="white" />
                  <rect x="7" y="2" width="3" height="3" rx="0.5" fill="white" />
                  <rect x="12" y="2" width="6" height="3" rx="0.5" fill="white" />
                  <rect x="2" y="7" width="6" height="3" rx="0.5" fill="white" />
                  <rect x="11" y="7" width="3" height="3" rx="0.5" fill="white" />
                  <rect x="2" y="12" width="3" height="6" rx="0.5" fill="white" />
                  <rect x="7" y="12" width="3" height="3" rx="0.5" fill="white" />
                  <rect x="12" y="15" width="6" height="3" rx="0.5" fill="white" />
                </svg>
              </div>
              <div>
                <div className="font-[Manrope] font-extrabold text-sm leading-tight text-[#0F172A]">FLEET MASTER</div>
                <div className="font-[Inter] text-[10px] text-slate-400 tracking-widest leading-tight">PRECISION CONTROL</div>
              </div>
            </div>
          </div>

          {/* Form header */}
          <div className="mb-8">
            <h1 className="font-[Manrope] text-2xl font-extrabold text-[#0F172A]">Welcome back</h1>
            <p className="text-slate-500 text-sm mt-1">Sign in to your Fleet Master account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {serverError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-red-700 text-sm">{serverError}</p>
              </div>
            )}

            <Field label="Email address" error={errors.email}>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className={inputCls}
                autoComplete="email"
              />
            </Field>

            <Field label="Password" error={errors.password}>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className={inputCls}
                autoComplete="current-password"
              />
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0052CC] hover:bg-[#003d99] disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Register link */}
          <p className="text-center text-sm text-slate-500 mt-6">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-[#0052CC] hover:text-[#003d99] font-semibold hover:underline transition-colors">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

const inputCls =
  'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0052CC] focus:border-transparent transition-colors bg-slate-50 focus:bg-white'
