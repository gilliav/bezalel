import * as React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-sm px-2 py-0.5 text-sm font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary/15 text-primary',
        muted: 'bg-muted text-muted-foreground',
        destructive: 'bg-destructive/15 text-destructive',
        outline: 'border border-border text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

const Badge = React.forwardRef(({ className, variant, style, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(badgeVariants({ variant }), className)}
    style={style}
    {...props}
  />
))
Badge.displayName = 'Badge'

export { Badge, badgeVariants }
