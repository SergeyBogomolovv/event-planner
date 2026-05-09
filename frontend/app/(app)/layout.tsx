import Link from 'next/link'
import { CalendarDays } from 'lucide-react'
import { AppSidebarNav } from '@/components/app-sidebar-link'
import { LogoutButton } from '@/components/logout-button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { getCurrentUser, getUnreadNotificationsCount } from '@/lib/server-api'

const roleLabels = {
  admin: 'Администратор',
  user: 'Пользователь',
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, unreadNotificationsCount] = await Promise.all([
    getCurrentUser(),
    getUnreadNotificationsCount(),
  ])

  return (
    <main className='min-h-screen bg-[linear-gradient(180deg,#f8faf7_0%,#eef4f1_45%,#f7f7f2_100%)] text-zinc-950'>
      <div className='mx-auto flex min-h-screen max-w-7xl'>
        <aside className='hidden w-72 border-r border-zinc-200/80 bg-white/90 p-6 backdrop-blur md:block'>
          <Link href='/dashboard' className='flex items-center gap-3 text-lg font-semibold'>
            <span className='grid size-9 place-items-center rounded-lg bg-zinc-950 text-white'>
              <CalendarDays className='h-5 w-5' />
            </span>
            <span>Event Planner</span>
          </Link>
          <AppSidebarNav unreadNotificationsCount={unreadNotificationsCount} />

          <Separator className='my-6' />
          <div className='rounded-xl bg-muted/70 p-4 text-sm ring-1 ring-border'>
            <div className='space-y-3'>
              <div className='flex items-start justify-between gap-3'>
                <p className='min-w-0 break-words font-medium'>{user.name}</p>
                <Badge variant='outline' className='shrink-0'>
                  {roleLabels[user.role]}
                </Badge>
              </div>
              <p className='break-all leading-5 text-muted-foreground'>{user.email}</p>
            </div>
          </div>
        </aside>

        <section className='flex min-w-0 flex-1 flex-col'>
          <header className='sticky top-0 z-20 flex items-center justify-between border-b border-zinc-200/80 bg-white/85 px-6 py-4 backdrop-blur'>
            <div className='flex items-center gap-3'>
              <CalendarDays className='h-5 w-5' />
              <span className='font-medium'>Кабинет</span>
            </div>
            <LogoutButton />
          </header>
          <div className='flex-1 p-6'>{children}</div>
        </section>
      </div>
    </main>
  )
}
