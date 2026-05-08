'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, LayoutDashboard, PlusCircle, UserRound, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type AppSidebarLinkProps = {
  href: string
  icon: LucideIcon
  label: string
}

export function AppSidebarLink({ href, icon: Icon, label }: AppSidebarLinkProps) {
  const pathname = usePathname()
  const active = pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
        active ? 'bg-zinc-950 text-white' : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950',
      )}
      href={href}
    >
      <Icon className='h-4 w-4' />
      {label}
    </Link>
  )
}

const navigationItems: AppSidebarLinkProps[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Кабинет' },
  { href: '/events/my', icon: CalendarDays, label: 'Мои мероприятия' },
  { href: '/events/new', icon: PlusCircle, label: 'Создать' },
  { href: '/profile', icon: UserRound, label: 'Профиль' },
]

export function AppSidebarNav() {
  return (
    <nav className='mt-8 space-y-1'>
      {navigationItems.map((item) => (
        <AppSidebarLink key={item.href} {...item} />
      ))}
    </nav>
  )
}
