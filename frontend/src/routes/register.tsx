import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { decodeJwtPayload } from '@/api/auth'
import { register } from '@/api/generated/auth-controller/auth-controller'
import { RegisterSchema } from '@/api/schemas'
import { useAuthStore } from '@/store/auth.store'
import type { Role } from '@/store/auth.store'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

const ROLE_LABELS: Record<Exclude<Role, 'ADMIN'>, string> = {
  STANDARD_USER: 'Standard User',
  FLEET_MANAGER: 'Fleet Manager',
  FLEET_DRIVER: 'Fleet Driver',
  SERVICE_SHOP_REPRESENTATIVE: 'Service Shop Representative',
}

function FleetMasterLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shrink-0">
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

function RegisterPage() {
  const navigate = useNavigate()
  const storeLogin = useAuthStore((s) => s.login)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'STANDARD_USER' as Exclude<Role, 'ADMIN'>,
    serviceShopMode: 'join' as 'join' | 'new',
    serviceShopId: '',
    newServiceShopName: '',
    newServiceShopAddress: '',
    newServiceShopEmail: '',
    newServiceShopPhone: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const { data: approvedShops = [] } = useQuery({
    queryKey: ['approved-shops'],
    queryFn: async () => {
      // Need to import getApprovedServiceShops
      const { getApprovedServiceShops } = await import('@/api/generated/service-shop/service-shop')
      return getApprovedServiceShops() ?? []
    },
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setServerError('')

    const result = RegisterSchema.safeParse(form)
    if (!result.success) {
      const fe: Partial<Record<keyof typeof form, string>> = {}
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
      const payloadData: Record<string, unknown> = { ...result.data }
      if (form.role === 'SERVICE_SHOP_REPRESENTATIVE') {
        if (form.serviceShopMode === 'join') {
          if (!form.serviceShopId) {
            setServerError('Please select a service shop.')
            setLoading(false)
            return
          }
          payloadData.serviceShopId = form.serviceShopId
        } else {
          if (!form.newServiceShopName) {
            setServerError('Shop name is required.')
            setLoading(false)
            return
          }
          payloadData.newServiceShop = {
            name: form.newServiceShopName,
            address: form.newServiceShopAddress,
            contactEmail: form.newServiceShopEmail,
            contactPhone: form.newServiceShopPhone,
          }
        }
      }

      const data = await register(payloadData)
      const payload = decodeJwtPayload(data.token ?? '')
      const email = typeof payload.sub === 'string' ? payload.sub : form.email
      const role = (payload.role ?? form.role) as Role
      storeLogin(data.token ?? '', email, role)
      navigate({ to: '/dashboard' })
    } catch {
      setServerError('Registration failed. The email may already be in use.')
    } finally {
      setLoading(false)
    }
  }

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm({ ...form, [k]: e.target.value })

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
            Join Fleet Master.<br />Take Control.
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            Create your account and start managing your fleet with precision. Track vehicles, assign drivers, and stay on top of every mile.
          </p>

          {/* Feature bullets */}
          <div className="mt-8 space-y-3">
            {[
              'Instant fleet dashboard access',
              'Role-based access control',
              'Vehicle lifecycle management',
              'Service & maintenance tracking',
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-slate-300">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
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
              <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
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
                <div className="font-[Manrope] font-extrabold text-sm leading-tight text-neutral-dark">FLEET MASTER</div>
                <div className="font-[Inter] text-[10px] text-slate-400 tracking-widest leading-tight">PRECISION CONTROL</div>
              </div>
            </div>
          </div>

          {/* Form header */}
          <div className="mb-7">
            <h1 className="font-[Manrope] text-2xl font-extrabold text-neutral-dark">Create account</h1>
            <p className="text-slate-500 text-sm mt-1">Get started with Fleet Master today</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {serverError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-red-700 text-sm">{serverError}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="First Name" error={errors.firstName}>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={set('firstName')}
                  placeholder="John"
                  className={inputCls}
                  autoComplete="given-name"
                />
              </Field>
              <Field label="Last Name" error={errors.lastName}>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={set('lastName')}
                  placeholder="Doe"
                  className={inputCls}
                  autoComplete="family-name"
                />
              </Field>
            </div>

            <Field label="Email address" error={errors.email}>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="you@example.com"
                className={inputCls}
                autoComplete="email"
              />
            </Field>

            <Field label="Password" error={errors.password}>
              <input
                type="password"
                value={form.password}
                onChange={set('password')}
                placeholder="Min. 8 characters"
                className={inputCls}
                autoComplete="new-password"
              />
            </Field>

            <Field label="Role" error={errors.role}>
              <select
                value={form.role}
                onChange={set('role')}
                className={selectCls}
              >
                {(Object.entries(ROLE_LABELS) as [Exclude<Role, 'ADMIN'>, string][]).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </Field>

            {form.role === 'SERVICE_SHOP_REPRESENTATIVE' && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="shopMode"
                      value="join"
                      checked={form.serviceShopMode === 'join'}
                      onChange={() => setForm({ ...form, serviceShopMode: 'join' })}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-slate-700">Join Existing Shop</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="shopMode"
                      value="new"
                      checked={form.serviceShopMode === 'new'}
                      onChange={() => setForm({ ...form, serviceShopMode: 'new' })}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-slate-700">Register New Shop</span>
                  </label>
                </div>

                {form.serviceShopMode === 'join' ? (
                  <Field label="Select Service Shop">
                    <select
                      value={form.serviceShopId}
                      onChange={set('serviceShopId')}
                      className={selectCls}
                    >
                      <option value="" disabled>-- Select a Shop --</option>
                      {approvedShops.map((shop: { id: string; name: string; address: string }) => (
                        <option key={shop.id} value={shop.id}>
                          {shop.name} ({shop.address})
                        </option>
                      ))}
                    </select>
                  </Field>
                ) : (
                  <div className="space-y-3">
                    <Field label="Shop Name">
                      <input
                        type="text"
                        value={form.newServiceShopName}
                        onChange={set('newServiceShopName')}
                        placeholder="e.g. AutoFix Garage"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Shop Address">
                      <input
                        type="text"
                        value={form.newServiceShopAddress}
                        onChange={set('newServiceShopAddress')}
                        placeholder="123 Main St"
                        className={inputCls}
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Contact Email">
                        <input
                          type="email"
                          value={form.newServiceShopEmail}
                          onChange={set('newServiceShopEmail')}
                          placeholder="shop@example.com"
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Contact Phone">
                        <input
                          type="text"
                          value={form.newServiceShopPhone}
                          onChange={set('newServiceShopPhone')}
                          placeholder="555-0123"
                          className={inputCls}
                        />
                      </Field>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account…
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Login link */}
          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:text-primary-dark font-semibold hover:underline transition-colors">
              Sign in
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
  'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-neutral-dark placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0052CC] focus:border-transparent transition-colors bg-slate-50 focus:bg-white'

const selectCls =
  'w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-neutral-dark focus:outline-none focus:ring-2 focus:ring-[#0052CC] focus:border-transparent transition-colors bg-slate-50 focus:bg-white'
