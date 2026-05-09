import { CalendarDays, ShieldCheck, UsersRound, UserX } from 'lucide-react'
import Link from 'next/link'
import { NoAccess } from '@/components/no-access'
import { PageHero } from '@/components/page-hero'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { eventStatusLabels } from '@/lib/event-labels'
import { participantStatusLabels } from '@/lib/participant-labels'
import { getAdminStats, getCurrentUser } from '@/lib/server-api'
import { userRoleLabels, userStatusLabels } from '@/lib/user-labels'

export default async function AdminPage() {
  const user = await getCurrentUser()

  if (user.role !== 'admin') {
    return <NoAccess />
  }

  const stats = await getAdminStats()

  return (
    <div className='space-y-6'>
      <PageHero
        icon={ShieldCheck}
        eyebrow='Администрирование'
        title='Панель управления'
        description='Сводка пользователей, мероприятий и участия.'
        action={
          <div className='flex flex-wrap gap-2'>
            <Link href='/admin/users' className={buttonVariants({ variant: 'secondary' })}>
              Пользователи
            </Link>
            <Link href='/admin/events' className={buttonVariants({ variant: 'secondary' })}>
              Мероприятия
            </Link>
          </div>
        }
      >
        <div className='grid gap-3 md:grid-cols-3'>
          <Metric icon={UsersRound} label='Пользователи' value={stats.users.total} />
          <Metric icon={CalendarDays} label='Мероприятия' value={stats.events.total} />
          <Metric icon={UserX} label='Участия' value={stats.participants.total} />
        </div>
      </PageHero>

      <section className='grid gap-4 lg:grid-cols-3'>
        <StatsCard title='Пользователи'>
          {Object.entries(stats.users.byRole).map(([role, count]) => (
            <StatsRow key={role} label={userRoleLabels[role as keyof typeof userRoleLabels]} value={count} />
          ))}
          {Object.entries(stats.users.byStatus).map(([status, count]) => (
            <StatsRow
              key={status}
              label={userStatusLabels[status as keyof typeof userStatusLabels]}
              value={count}
            />
          ))}
        </StatsCard>

        <StatsCard title='Мероприятия'>
          {Object.entries(stats.events.byStatus).map(([status, count]) => (
            <StatsRow
              key={status}
              label={eventStatusLabels[status as keyof typeof eventStatusLabels]}
              value={count}
            />
          ))}
        </StatsCard>

        <StatsCard title='Участники'>
          {Object.entries(stats.participants.byStatus).map(([status, count]) => (
            <StatsRow
              key={status}
              label={participantStatusLabels[status as keyof typeof participantStatusLabels]}
              value={count}
            />
          ))}
        </StatsCard>
      </section>
    </div>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
}) {
  return (
    <div className='rounded-lg bg-white/10 p-4 ring-1 ring-white/10'>
      <Icon className='h-5 w-5 text-teal-200' />
      <p className='mt-3 text-sm text-zinc-300'>{label}</p>
      <p className='mt-1 text-3xl font-semibold text-white'>{value}</p>
    </div>
  )
}

function StatsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className='shadow-sm'>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>{children}</CardContent>
    </Card>
  )
}

function StatsRow({ label, value }: { label: string; value: number }) {
  return (
    <div className='flex items-center justify-between gap-3 rounded-lg bg-muted/60 px-3 py-2'>
      <span className='text-sm text-muted-foreground'>{label}</span>
      <Badge variant='secondary'>{value}</Badge>
    </div>
  )
}
