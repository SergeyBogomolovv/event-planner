import { ShieldCheck } from 'lucide-react'
import { notFound } from 'next/navigation'
import { PageHero } from '@/components/page-hero'
import { ParticipantActions } from '@/components/participant-actions'
import { UserInviteSearch } from '@/components/user-invite-search'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { eventStatusLabels } from '@/lib/event-labels'
import { formatParticipantDate, participantStatusLabels } from '@/lib/participant-labels'
import { getEvent, getManageParticipants } from '@/lib/server-api'

type ManageParticipantsPageProps = {
  params: Promise<{ eventId: string }>
}

export default async function ManageParticipantsPage({ params }: ManageParticipantsPageProps) {
  const { eventId } = await params
  const [event, participants] = await Promise.all([
    getEvent(eventId).catch(() => null),
    getManageParticipants(eventId).catch(() => null),
  ])

  if (!event || !participants || !event.relation.isOrganizer) {
    notFound()
  }

  return (
    <div className='space-y-6'>
      <PageHero
        icon={ShieldCheck}
        eyebrow='Управление'
        title='Участники мероприятия'
        description={event.title}
      />

      <div className='grid gap-4 lg:grid-cols-[1fr_380px]'>
        <Card className='shadow-sm'>
          <CardHeader>
            <CardTitle>Список приглашений</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            {participants.length ? (
              participants.map((participant) => (
                <div
                  key={participant.id}
                  className='flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4'
                >
                  <div className='min-w-0'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <p className='font-medium'>{participant.user.name}</p>
                      <Badge variant='secondary'>{participantStatusLabels[participant.status]}</Badge>
                    </div>
                    <p className='mt-1 break-all text-sm text-muted-foreground'>{participant.user.email}</p>
                    <p className='mt-2 text-xs text-muted-foreground'>
                      Приглашён: {formatParticipantDate(participant.invitedAt)}
                    </p>
                  </div>
                  {participant.status !== 'removed' ? (
                    <ParticipantActions eventId={event.id} participant={participant} mode='remove' />
                  ) : null}
                </div>
              ))
            ) : (
              <div className='rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground'>
                Приглашений пока нет.
              </div>
            )}
          </CardContent>
        </Card>

        <div className='space-y-4'>
          {event.status === 'active' ? (
            <UserInviteSearch eventId={event.id} />
          ) : (
            <Card className='shadow-sm'>
              <CardHeader>
                <CardTitle>Приглашения недоступны</CardTitle>
              </CardHeader>
              <CardContent className='text-sm leading-6 text-muted-foreground'>
                Текущий статус мероприятия: {eventStatusLabels[event.status].toLowerCase()}. Приглашать участников можно после публикации.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
