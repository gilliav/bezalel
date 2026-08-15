import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { IconButton } from './ui/IconButton'

export function PageHeader({ title, action, hasBackButton, authSlot }) {
  const navigate = useNavigate()

  return (
    <header className="page-header">
      {hasBackButton && (
        <IconButton icon={ChevronRight} size={20} onClick={() => navigate(-1)} className="ml-2 -my-1" aria-label="חזרה" />
      )}
      <h1>{title}</h1>
      <div className="flex items-baseline gap-2">
        {action && <div>{action}</div>}
        {authSlot && <>| <div> {authSlot}</div></>}
      </div>
    </header>
  )
}
