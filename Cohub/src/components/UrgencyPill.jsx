const VARIANT_CLASS = {
  dark: 'pill-dark',
  muted: 'pill-muted',
  danger: 'pill-danger',
}

export function UrgencyPill({ label, variant }) {
  return (
    <span className={`pill ${VARIANT_CLASS[variant]}`}>{label}</span>
  )
}
