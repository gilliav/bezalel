
export function Toast({ message }) {
  if (!message) return null
  return (
    <div
      role="alert"
      className="fixed top-4 right-4 left-4 bg-destructive text-destructive-foreground text-base px-4 py-3 rounded-lg shadow-lg z-50 text-right"
    >
      {message}
    </div>
  )
}
