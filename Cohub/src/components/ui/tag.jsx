import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'

export function Tag({ value, color, to, className }) {
  const style = color
    ? { backgroundColor: color + '22', color }
    : undefined

  const base = cn(
    'rounded-lg px-2.5 py-0.25',
    className
  )

  if (to) {
    return (
      <Link to={to} className={base} style={style}>
        {value}
      </Link>
    )
  }

  return (
    <div className={base} style={style}>
      {value}
    </div>
  )
}
