export function ConnectionBanner({ isOnline }) {
  if (isOnline) return null
  return (
    <div
      role="status"
      className="fixed top-0 right-0 left-0 bg-yellow-400 text-yellow-900 text-sm text-center py-2 z-50"
    >
      אין חיבור לאינטרנט
    </div>
  )
}
