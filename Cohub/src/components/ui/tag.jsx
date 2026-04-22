import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'

export function Tag({ value, color, to, className }) {
  const style = color
    ? { backgroundColor: color + '22', color }
    : undefined

  if (to) {
    return (
      <Link to={to} className={cn('px-1', className)} style={style}>
        {value}
      </Link>
    )
  }

  return (
    <div className={cn('px-1', className)} style={style}>
      {value}
    </div>
  )
}
