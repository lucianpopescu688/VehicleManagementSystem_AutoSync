export function ProgressBar({
  value,
  max = 100,
  tone = 'auto',
}: {
  value: number
  max?: number
  tone?: 'auto' | 'primary' | 'warning' | 'danger'
}) {
  const pct = Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0))

  const color =
    tone === 'primary'
      ? 'bg-primary'
      : tone === 'warning'
        ? 'bg-amber-500'
        : tone === 'danger'
          ? 'bg-red-500'
          : pct >= 90
            ? 'bg-red-500'
            : pct >= 70
              ? 'bg-amber-500'
              : 'bg-primary'

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}
