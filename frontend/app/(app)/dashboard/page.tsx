import { Bell, CalendarDays, CalendarPlus, CheckCircle2, Inbox, Sparkles } from 'lucide-react'
import Link from 'next/link'
import type React from 'react'
import { EmptyState } from '@/components/empty-state'
import { EventCard } from '@/components/event-card'
import { InvitationActions } from '@/components/invitation-actions'
import { PageHero } from '@/components/page-hero'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatEventDate } from '@/lib/event-labels'
import { formatNotificationDate, notificationTypeLabels } from '@/lib/notification-labels'
import { getCurrentUser, getDashboard } from '@/lib/server-api'

export default async function DashboardPage() {
  const [user, dashboard] = await Promise.all([getCurrentUser(), getDashboard()])

  return (
    <div className='space-y-6'>
      <PageHero
        icon={Sparkles}
        eyebrow='Кабинет'
        title={`Здравствуйте, ${user.name}`}
        description='Собрали ближайшие мероприятия, приглашения и непрочитанные уведомления в одном месте.'
        action={
          <Link
            href='/events/new'
            className={buttonVariants({
              className: 'bg-teal-300 text-zinc-950 hover:bg-teal-200',
            })}
          >
            <CalendarPlus className='h-4 w-4' />
            Создать
          </Link>
        }
      >
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          <MetricCard label='Мои мероприятия' value={dashboard.counts.createdEvents} />
          <MetricCard label='Я участвую' value={dashboard.counts.participatingEvents} />
          <MetricCard label='Приглашения' value={dashboard.counts.pendingInvitations} />
          <MetricCard label='Непрочитанные' value={dashboard.counts.unreadNotifications} />
        </div>
      </PageHero>

      <section className='grid gap-4 xl:grid-cols-[1.4fr_1fr]'>
        <DashboardSection
          title='Ближайшие мероприятия'
          icon={CalendarDays}
          href='/events/participating'
          actionLabel='Все участия'
        >
          {dashboard.upcomingEvents.length ? (
            <div className='space-y-3'>
              {dashboard.upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CalendarDays}
              title='Нет ближайших мероприятий'
              description='Когда появятся события с вашим участием, они будут здесь.'
            />
          )}
        </DashboardSection>

        <DashboardSection
          title='Новые приглашения'
          icon={Inbox}
          href='/invitations'
          actionLabel='Все приглашения'
        >
          {dashboard.pendingInvitations.length ? (
            <div className='space-y-3'>
              {dashboard.pendingInvitations.map((invitation) => (
                <Card key={invitation.id} className='py-0 shadow-sm'>
                  <CardContent className='space-y-4 p-5'>
                    <div className='space-y-1'>
                      <Link
                        href={`/events/${invitation.event.id}`}
                        className='text-lg font-semibold hover:text-teal-800'
                      >
                        {invitation.event.title}
                      </Link>
                      <p className='text-sm text-muted-foreground'>
                        {formatEventDate(invitation.event.startsAt)}
                      </p>
                    </div>
                    <InvitationActions invitation={invitation} currentUserId={user.id} />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CheckCircle2}
              title='Приглашений нет'
              description='Новые приглашения появятся здесь сразу после отправки.'
            />
          )}
        </DashboardSection>
      </section>

      <section className='grid gap-4 xl:grid-cols-2'>
        <DashboardSection
          title='Мои мероприятия'
          icon={CalendarPlus}
          href='/events/my'
          actionLabel='Открыть список'
        >
          {dashboard.createdEvents.length ? (
            <div className='space-y-3'>
              {dashboard.createdEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CalendarPlus}
              title='Вы еще ничего не создали'
              description='Создайте черновик мероприятия и пригласите участников после публикации.'
              action={
                <Link href='/events/new' className={buttonVariants()}>
                  Создать мероприятие
                </Link>
              }
            />
          )}
        </DashboardSection>

        <DashboardSection
          title='Непрочитанные уведомления'
          icon={Bell}
          href='/notifications'
          actionLabel='Все уведомления'
        >
          {dashboard.unreadNotifications.length ? (
            <div className='space-y-3'>
              {dashboard.unreadNotifications.map((notification) => (
                <div key={notification.id} className='rounded-lg bg-muted/70 p-4'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <Badge>{notificationTypeLabels[notification.type]}</Badge>
                    <span className='text-sm text-muted-foreground'>
                      {formatNotificationDate(notification.createdAt)}
                    </span>
                  </div>
                  <p className='mt-3 font-medium'>{notification.title}</p>
                  <p className='mt-1 text-sm leading-6 text-muted-foreground'>
                    {notification.message}
                  </p>
                  {notification.relatedEvent ? (
                    <Link
                      href={`/events/${notification.relatedEvent.id}`}
                      className={buttonVariants({
                        variant: 'link',
                        className: 'mt-2 h-auto p-0 text-teal-800',
                      })}
                    >
                      Открыть
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Bell}
              title='Все прочитано'
              description='Непрочитанные уведомления будут появляться в этом блоке.'
            />
          )}
        </DashboardSection>
      </section>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className='rounded-lg bg-white/10 p-4 ring-1 ring-white/10'>
      <p className='text-sm text-zinc-300'>{label}</p>
      <p className='mt-2 text-3xl font-semibold text-white'>{value}</p>
    </div>
  )
}

function DashboardSection({
  title,
  icon: Icon,
  href,
  actionLabel,
  children,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  actionLabel: string
  children: React.ReactNode
}) {
  return (
    <Card className='py-0 shadow-sm'>
      <CardHeader className='flex flex-row items-center justify-between gap-4 p-5'>
        <CardTitle className='flex items-center gap-2'>
          <Icon className='h-5 w-5 text-teal-700' />
          {title}
        </CardTitle>
        <Link href={href} className='text-sm font-medium text-teal-800 hover:text-teal-950'>
          {actionLabel}
        </Link>
      </CardHeader>
      <CardContent className='px-5 pb-5'>{children}</CardContent>
    </Card>
  )
}
