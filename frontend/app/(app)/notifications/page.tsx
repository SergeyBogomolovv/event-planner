import { Bell, Inbox } from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from '@/components/empty-state'
import { NotificationReadButton } from '@/components/notification-read-button'
import { PageHero } from '@/components/page-hero'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatNotificationDate, notificationTypeLabels } from '@/lib/notification-labels'
import { getNotifications, getUnreadNotificationsCount } from '@/lib/server-api'

export default async function NotificationsPage() {
  const [notifications, unreadCount] = await Promise.all([
    getNotifications(),
    getUnreadNotificationsCount(),
  ])

  return (
    <div className='space-y-6'>
      <PageHero
        icon={Bell}
        eyebrow={`${unreadCount} новых`}
        title='Уведомления'
        description='Приглашения, изменения мероприятий и ответы участников собраны в одном месте.'
      />

      {notifications.length ? (
        <div className='space-y-3'>
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={notification.readAt ? 'py-0 shadow-sm' : 'border-teal-300 py-0 shadow-sm'}
            >
              <CardContent className='flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between'>
                <div className='min-w-0 space-y-2'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <Badge variant={notification.readAt ? 'secondary' : 'default'}>
                      {notificationTypeLabels[notification.type]}
                    </Badge>
                    <span className='text-sm text-muted-foreground'>
                      {formatNotificationDate(notification.createdAt)}
                    </span>
                  </div>
                  <div>
                    <h2 className='text-lg font-semibold'>{notification.title}</h2>
                    <p className='mt-1 leading-6 text-muted-foreground'>{notification.message}</p>
                  </div>
                  {notification.relatedEvent ? (
                    <Link
                      href={`/events/${notification.relatedEvent.id}`}
                      className='inline-flex text-sm font-medium text-teal-800 hover:text-teal-950'
                    >
                      Открыть мероприятие
                    </Link>
                  ) : null}
                </div>
                <NotificationReadButton notification={notification} />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Inbox}
          title='Уведомлений пока нет'
          description='Когда появятся приглашения, изменения мероприятий или ответы участников, они будут здесь.'
        />
      )}
    </div>
  )
}
