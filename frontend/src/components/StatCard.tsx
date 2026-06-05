import type { ReactNode } from 'react'

export function StatCard({
  label,
  value,
  icon,
  hint,
  accent,
  accentBg,
}: {
  label: string
  value: ReactNode
  icon?: ReactNode
  hint?: string
  accent?: string
  accentBg?: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        {icon && (
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={accent || accentBg ? { backgroundColor: accentBg, color: accent } : undefined}
          >
            <span className={!accent ? 'text-primary' : ''}>{icon}</span>
          </div>
        )}
      </div>
      <p className="mt-2 font-[Manrope] text-2xl font-extrabold text-neutral-dark">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}
