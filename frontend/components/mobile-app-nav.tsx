'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, Menu, X } from 'lucide-react'
import type { CurrentUser } from '@/lib/api'
import { userRoleLabels } from '@/lib/user-labels'
import { AppSidebarNav } from '@/components/app-sidebar-link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

type MobileAppNavProps = {
  user: CurrentUser
  unreadNotificationsCount: number
}

export function MobileAppNav({ user, unreadNotificationsCount }: MobileAppNavProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''

    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <Button
        type='button'
        variant='outline'
        size='icon-lg'
        className='md:hidden'
        aria-label='Открыть меню'
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu className='h-5 w-5' />
      </Button>

      {open ? (
        <div className='fixed inset-0 z-50 md:hidden'>
          <button
            type='button'
            className='absolute inset-0 bg-zinc-950/45'
            aria-label='Закрыть меню'
            onClick={() => setOpen(false)}
          />
          <aside className='relative h-dvh w-full max-w-sm overflow-y-auto bg-white px-6 py-6 shadow-2xl'>
            <div className='flex items-center justify-between gap-4'>
              <Link href='/dashboard' className='flex min-w-0 items-center gap-3 text-lg font-semibold'>
                <span className='grid size-11 shrink-0 place-items-center rounded-xl bg-zinc-950 text-teal-200 shadow-sm'>
                  <CalendarDays className='h-5 w-5' />
                </span>
                <span className='min-w-0 truncate'>Event Planner</span>
              </Link>
              <Button
                type='button'
                variant='outline'
                size='icon-lg'
                aria-label='Закрыть меню'
                onClick={() => setOpen(false)}
              >
                <X className='h-5 w-5' />
              </Button>
            </div>

            <AppSidebarNav
              unreadNotificationsCount={unreadNotificationsCount}
              isAdmin={user.role === 'admin'}
              onNavigate={() => setOpen(false)}
            />

            <Separator className='my-6' />

            <div className='rounded-xl bg-muted/70 p-4 text-sm ring-1 ring-border'>
              <div className='space-y-3'>
                <div className='flex items-start justify-between gap-3'>
                  <p className='min-w-0 break-words font-medium'>{user.name}</p>
                  <Badge variant='outline' className='shrink-0'>
                    {userRoleLabels[user.role]}
                  </Badge>
                </div>
                <p className='break-all leading-5 text-muted-foreground'>{user.email}</p>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  )
}
