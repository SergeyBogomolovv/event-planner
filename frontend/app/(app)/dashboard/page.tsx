import { Bell, CalendarPlus, Inbox, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { PageHero } from '@/components/page-hero'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNotificationDate, notificationTypeLabels } from '@/lib/notification-labels'
import { getCurrentUser, getNotifications } from '@/lib/server-api'

export default async function DashboardPage() {
  const [user, notifications] = await Promise.all([getCurrentUser(), getNotifications()])
  const latestNotifications = notifications.slice(0, 3)

  return (
    <div className='space-y-6'>
      <PageHero
        icon={Sparkles}
        eyebrow='Сегодня'
        title={`Здравствуйте, ${user.name}`}
        description='Быстрый доступ к событиям, черновикам и профилю. Начните с нового мероприятия или вернитесь к текущим.'
      />

      <div className='grid gap-4 md:grid-cols-3'>
        {[
          [CalendarPlus, 'Мои мероприятия', 'Создавайте и ведите закрытые события', '/events/my'],
          [Inbox, 'Создать событие', 'Подготовьте черновик и опубликуйте его, когда всё готово', '/events/new'],
          [Sparkles, 'Профиль', 'Держите контактные данные в актуальном состоянии', '/profile'],
        ].map(([Icon, title, text, href]) => (
          <Card key={String(title)} className='py-0 transition-colors hover:ring-teal-300'>
            <Link href={String(href)} className='block p-5'>
              <CardHeader className='p-0'>
                <span className='grid size-10 place-items-center rounded-lg bg-muted text-muted-foreground'>
                  <Icon className='h-5 w-5' />
                </span>
                <CardTitle className='mt-4'>{String(title)}</CardTitle>
              </CardHeader>
              <CardContent className='p-0 pt-2 text-sm text-muted-foreground'>{String(text)}</CardContent>
            </Link>
          </Card>
        ))}
      </div>

      <Card className='py-0 shadow-sm'>
        <CardHeader className='flex flex-row items-center justify-between gap-4 p-5'>
          <div>
            <CardTitle className='flex items-center gap-2'>
              <Bell className='h-5 w-5 text-teal-700' />
              Последние уведомления
            </CardTitle>
          </div>
          <Link href='/notifications' className='text-sm font-medium text-teal-800 hover:text-teal-950'>
            Все уведомления
          </Link>
        </CardHeader>
        <CardContent className='space-y-3 px-5 pb-5'>
          {latestNotifications.length ? (
            latestNotifications.map((notification) => (
              <div
                key={notification.id}
                className='flex flex-col gap-2 rounded-lg bg-muted/70 p-4 md:flex-row md:items-start md:justify-between'
              >
                <div>
                  <div className='flex flex-wrap items-center gap-2'>
                    <Badge variant={notification.readAt ? 'secondary' : 'default'}>
                      {notificationTypeLabels[notification.type]}
                    </Badge>
                    <span className='text-sm text-muted-foreground'>
                      {formatNotificationDate(notification.createdAt)}
                    </span>
                  </div>
                  <p className='mt-2 font-medium'>{notification.title}</p>
                  <p className='mt-1 text-sm leading-6 text-muted-foreground'>{notification.message}</p>
                </div>
                {notification.relatedEvent ? (
                  <Link
                    href={`/events/${notification.relatedEvent.id}`}
                    className='shrink-0 text-sm font-medium text-teal-800 hover:text-teal-950'
                  >
                    Открыть
                  </Link>
                ) : null}
              </div>
            ))
          ) : (
            <p className='rounded-lg bg-muted/70 p-4 text-sm text-muted-foreground'>
              Новых уведомлений пока нет.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
