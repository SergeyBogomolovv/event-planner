import { MailOpen } from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from '@/components/empty-state'
import { InvitationActions } from '@/components/invitation-actions'
import { PageHero } from '@/components/page-hero'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { eventFormatLabels, formatEventDate } from '@/lib/event-labels'
import { getCurrentUser, getInvitations } from '@/lib/server-api'

export default async function InvitationsPage() {
  const [user, invitations] = await Promise.all([getCurrentUser(), getInvitations()])

  return (
    <div className='space-y-6'>
      <PageHero
        icon={MailOpen}
        eyebrow='Приглашения'
        title='Входящие приглашения'
        description='Мероприятия, где организатор ждёт вашего ответа.'
      />

      {invitations.length ? (
        <div className='grid gap-4'>
          {invitations.map((invitation) => (
            <Card key={invitation.id} className='shadow-sm'>
              <CardHeader className='flex flex-row flex-wrap items-start justify-between gap-4'>
                <div className='space-y-2'>
                  <Badge variant='secondary'>{eventFormatLabels[invitation.event.format]}</Badge>
                  <CardTitle>
                    <Link href={`/events/${invitation.event.id}`} className='hover:text-teal-800'>
                      {invitation.event.title}
                    </Link>
                  </CardTitle>
                  <p className='text-sm text-muted-foreground'>
                    {formatEventDate(invitation.event.startsAt)} · {invitation.invitedBy.name}
                  </p>
                </div>
                <InvitationActions invitation={invitation} currentUserId={user.id} />
              </CardHeader>
              <CardContent>
                <p className='line-clamp-3 text-sm leading-6 text-zinc-600'>{invitation.event.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={MailOpen}
          title='Новых приглашений нет'
          description='Когда организатор пригласит вас на мероприятие, оно появится здесь.'
          action={
            <Link href='/events/participating' className={buttonVariants()}>
              Мои участия
            </Link>
          }
        />
      )}
    </div>
  )
}
