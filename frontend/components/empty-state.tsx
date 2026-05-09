import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type EmptyStateProps = {
  icon?: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <Card className={cn('border-dashed bg-white/80 py-0 shadow-sm shadow-zinc-200/60', className)}>
      <CardContent className='flex flex-col items-center p-10 text-center'>
        {Icon ? (
          <span className='grid size-12 place-items-center rounded-lg bg-muted text-muted-foreground ring-1 ring-border/80'>
            <Icon className='h-5 w-5' />
          </span>
        ) : null}
        <h2 className='mt-4 text-xl font-semibold'>{title}</h2>
        <p className='mt-2 max-w-md text-sm leading-6 text-muted-foreground'>{description}</p>
        {action ? <div className='mt-5'>{action}</div> : null}
      </CardContent>
    </Card>
  )
}
