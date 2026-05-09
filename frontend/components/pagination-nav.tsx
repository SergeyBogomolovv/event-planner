import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type PaginationNavProps = {
  basePath: string
  page: number
  totalPages: number
}

export function PaginationNav({ basePath, page, totalPages }: PaginationNavProps) {
  if (totalPages <= 1) {
    return null
  }

  return (
    <nav className='flex items-center justify-between gap-3 border-t border-border px-4 py-3'>
      <PageLink basePath={basePath} page={page - 1} disabled={page <= 1}>
        <ChevronLeft className='h-4 w-4' />
        Назад
      </PageLink>
      <span className='text-sm text-muted-foreground'>
        Страница {page} из {totalPages}
      </span>
      <PageLink basePath={basePath} page={page + 1} disabled={page >= totalPages}>
        Далее
        <ChevronRight className='h-4 w-4' />
      </PageLink>
    </nav>
  )
}

function PageLink({
  basePath,
  page,
  disabled,
  children,
}: {
  basePath: string
  page: number
  disabled: boolean
  children: React.ReactNode
}) {
  const className = buttonVariants({
    variant: 'outline',
    size: 'sm',
    className: cn('gap-2', disabled && 'pointer-events-none opacity-50'),
  })

  return (
    <Link href={`${basePath}?page=${page}`} aria-disabled={disabled} className={className}>
      {children}
    </Link>
  )
}
