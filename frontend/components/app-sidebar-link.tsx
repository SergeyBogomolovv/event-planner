'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarDays,
  LayoutDashboard,
  MailOpen,
  Bell,
  PlusCircle,
  UserRound,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type AppSidebarLinkProps = {
  href: string
  icon: LucideIcon
  label: string
  badgeCount?: number
}

export function AppSidebarLink({ href, icon: Icon, label, badgeCount = 0 }: AppSidebarLinkProps) {
  const pathname = usePathname()
  const active = pathname === href || pathname.startsWith(`${href}/`)
  const hasBadge = badgeCount > 0

  return (
    <Link
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
        active ? 'bg-zinc-950 text-white' : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950',
      )}
      href={href}
    >
      <Icon className='h-4 w-4' />
      <span className='min-w-0 flex-1'>{label}</span>
      {hasBadge ? (
        <span
          className={cn(
            'grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1.5 text-[11px] font-semibold leading-none text-white shadow-sm',
            active && 'ring-2 ring-white/25',
          )}
          aria-label={`${badgeCount} непрочитанных уведомлений`}
        >
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      ) : null}
    </Link>
  )
}

const navigationItems: AppSidebarLinkProps[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Кабинет' },
  { href: '/events/my', icon: CalendarDays, label: 'Мои мероприятия' },
  { href: '/invitations', icon: MailOpen, label: 'Приглашения' },
  { href: '/events/participating', icon: UsersRound, label: 'Я участвую' },
  { href: '/notifications', icon: Bell, label: 'Уведомления' },
  { href: '/events/new', icon: PlusCircle, label: 'Создать' },
  { href: '/profile', icon: UserRound, label: 'Профиль' },
]

type AppSidebarNavProps = {
  unreadNotificationsCount?: number
}

export function AppSidebarNav({ unreadNotificationsCount = 0 }: AppSidebarNavProps) {
  return (
    <nav className='mt-8 space-y-1'>
      {navigationItems.map((item) => (
        <AppSidebarLink
          key={item.href}
          {...item}
          badgeCount={item.href === '/notifications' ? unreadNotificationsCount : undefined}
        />
      ))}
    </nav>
  )
}
