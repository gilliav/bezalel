import { getLoadBucket } from '../../utils/catalogAggregate'

const SEGMENTS = [1, 2, 3, 4, 5]

export function LoadGauge({ label, value, onChange, heavyLabel = 'כבד' }) {
  const bucket = getLoadBucket(value, heavyLabel)

  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <div className="flex items-center gap-1.5">
        <span className="font-display text-xs font-bold" style={{ color: 'var(--foreground)' }}>קל</span>
        <div className="flex gap-0.5 flex-1">
          {SEGMENTS.map(n => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(value === n ? null : n)}
              aria-label={`${label}: ${n}`}
              className="flex-1 h-2.5 rounded-sm focus:outline-none"
              style={{ backgroundColor: value !== null && n <= value ? bucket.colorVar : 'var(--muted)' }}
            />
          ))}
        </div>
        <span className="font-display text-xs font-bold" style={{ color: 'var(--foreground)' }}>{heavyLabel}</span>
      </div>
    </div>
  )
}
