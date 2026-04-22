export function SectionTier({ label, variant }) {
  
  return (
    <div className="tier-row">
      <div className={variant === 'hot' ? 'tier-label-hot' : 'tier-label'}>
        {label}
      </div>
    </div>
  )
}
