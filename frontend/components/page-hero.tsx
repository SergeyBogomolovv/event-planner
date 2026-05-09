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
        'relative overflow-hidden rounded-xl bg-zinc-950 p-7 text-white shadow-[0_18px_60px_rgba(15,23,42,0.18)] ring-1 ring-white/10',
        'before:absolute before:inset-0 before:bg-[linear-gradient(90deg,rgba(45,212,191,0.16)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.07)_1px,transparent_1px)] before:bg-[size:44px_44px] before:opacity-45',
        'after:absolute after:inset-x-0 after:top-0 after:h-1 after:bg-[linear-gradient(90deg,#2dd4bf,#facc15,#fb7185)]',
        className,
      )}
    >
      <div className='relative flex flex-wrap items-start justify-between gap-5'>
        <div className='max-w-3xl'>
          <div className='flex flex-wrap items-center gap-3'>
            {Icon ? (
              <span className='grid size-10 place-items-center rounded-lg bg-white/10 text-teal-200 ring-1 ring-white/15 shadow-inner'>
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
          {description ? (
            <p className='mt-3 max-w-2xl leading-7 text-zinc-300'>{description}</p>
          ) : null}
        </div>
        {action ? <div className='shrink-0'>{action}</div> : null}
      </div>
      {children ? <div className='relative mt-6'>{children}</div> : null}
    </section>
  )
}
