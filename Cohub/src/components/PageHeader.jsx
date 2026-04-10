import { useNavigate } from 'react-router-dom'
import {ChevronRight} from 'lucide-react';

export function PageHeader({ title, action, hasBackButton, authSlot }) {
  const navigate = useNavigate()

  return (
    <header className="page-header">
      {hasBackButton && (
        <button onClick={() => navigate(-1)} className="back-button">
          <ChevronRight size={16} />
        </button>
      )}
      <h1>{title}</h1>
      <div className="flex items-center gap-2">
        {action && <div>{action}</div>}
        {authSlot && <div>{authSlot}</div>}
      </div>
    </header>
  )
}
