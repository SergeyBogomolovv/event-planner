import type { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type PageHeroProps = {
  title: string
  eyebrow?: string
  description?: string
  icon?: LucideIcon
  action?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

export function PageHero({
  title,
  eyebrow,
  description,
  icon: Icon,
  action,
  children,
  className,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-xl bg-zinc-950 p-7 text-white shadow-sm',
        className,
      )}
    >
      <div className='flex flex-wrap items-start justify-between gap-5'>
        <div className='max-w-3xl'>
          <div className='flex flex-wrap items-center gap-3'>
            {Icon ? (
              <span className='grid size-10 place-items-center rounded-lg bg-white/10 text-teal-200 ring-1 ring-white/10'>
                <Icon className='h-5 w-5' />
              </span>
            ) : null}
            {eyebrow ? (
              <Badge variant='secondary' className='bg-teal-300 text-zinc-950 hover:bg-teal-300'>
                {eyebrow}
              </Badge>
            ) : null}
          </div>
          <h1 className='mt-5 text-3xl font-semibold leading-tight md:text-4xl'>{title}</h1>
          {description ? <p className='mt-3 max-w-2xl leading-7 text-zinc-300'>{description}</p> : null}
        </div>
        {action ? <div className='shrink-0'>{action}</div> : null}
      </div>
      {children ? <div className='mt-6'>{children}</div> : null}
    </section>
  )
}
