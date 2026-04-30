import { useState } from 'react'
import { UserRoundIcon } from 'lucide-react'

export function AuthSlot({ user, signIn, signOut }) {
  const [menuOpen, setMenuOpen] = useState(false)

  if (user === undefined) return null

  if (!user) {
    return (
      <button
        onClick={signIn}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        התחבר.י למעקב אחר ההגשות שלך
      </button>
    )
  }

  const firstName = user.displayName?.split(' ')[0] ?? ''

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(o => !o)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <span>{firstName}</span>
        <UserRoundIcon size={14} />
      </button>

      {menuOpen && (
        <>
          <div
            data-testid="auth-menu-overlay"
            className="fixed inset-0 z-10"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute left-0 top-full z-20 mt-1 min-w-[7rem] bg-[var(--background)] border border-[var(--border)] border-b-2 border-b-[#1a1714]">
            <button
              onClick={() => { signOut(); setMenuOpen(false) }}
              className="w-full text-right px-3 py-2 text-sm text-foreground hover:bg-[var(--muted)] transition-colors"
            >
              התנתק.י
            </button>
          </div>
        </>
      )}
    </div>
  )
}
