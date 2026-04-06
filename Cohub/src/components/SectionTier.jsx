export function SectionTier({ label, variant }) {
  return (
    <div className="tier-row">
      <span className={variant === 'hot' ? 'tier-label-hot' : 'tier-label'}>
        {label}
      </span>
      <div className="tier-line" />
    </div>
  )
}
