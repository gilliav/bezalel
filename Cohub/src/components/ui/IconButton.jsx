import { cn } from '../../lib/utils'

/**
 * IconButton — a borderless button that fills its Lucide icon on hover.
 *
 * Props:
 * - icon: Lucide icon component (required)
 * - size: icon size in px (default: 20)
 * - className: extra classes on the button
 * - All other props forwarded to <button>
 */
export function IconButton({ icon: Icon, size = 20, hoverClass = 'hover:text-secondary', className, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        'group inline-flex items-center justify-center p-1 transition-colors text-foreground disabled:pointer-events-none disabled:opacity-50',
        hoverClass,
        className
      )}
      {...props}
    >
      <Icon size={size} className="shrink-0 group-hover:[&>*]:fill-current" />
    </button>
  )
}
