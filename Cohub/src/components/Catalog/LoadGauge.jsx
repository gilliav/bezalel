import { getLoadBucket } from '../../utils/catalogAggregate'

const SEGMENTS = [1, 2, 3, 4, 5]

export function LoadGauge({ label, value, onChange, heavyLabel = 'כבד' }) {
  const bucket = getLoadBucket(value, heavyLabel)

  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <div className="grid items-center">
        {/* <span className="text-xs font-semibold" style={{ color: 'var(--secondary)' }}>קל</span> */}
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
        <div className="flex flex-row justify-between gap-0.5">
                  <span className="text-xs font-semibold" style={{ color: 'var(--secondary)' }}>קל</span>

            <span className="text-xs font-semibold" style={{ color: 'var(--secondary)' }}>{heavyLabel}</span>
        </div>
      </div>
    </div>
  )
}
