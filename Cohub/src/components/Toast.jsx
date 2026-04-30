
export function Toast({ message, onDismiss }) {
  if (!message) return null
  return (
    <div
      role="alert"
      className="fixed top-4 right-4 left-4 bg-destructive text-destructive-foreground text-base px-4 py-3 rounded-lg shadow-lg z-50 flex items-center justify-between gap-3"
    >
      <span className="text-right flex-1">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="סגור"
          className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        >
          ✕
        </button>
      )}
    </div>
  )
}
