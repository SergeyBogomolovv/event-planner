import { Crown, UsersRound } from 'lucide-react'
import { notFound } from 'next/navigation'
import { EmptyState } from '@/components/empty-state'
import { PageHero } from '@/components/page-hero'
import { ParticipantActions } from '@/components/participant-actions'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { participantStatusLabels } from '@/lib/participant-labels'
import { getCurrentUser, getEvent, getParticipants, ServerApiRequestError } from '@/lib/server-api'

type ParticipantsPageProps = {
  params: Promise<{ eventId: string }>
}

export default async function ParticipantsPage({ params }: ParticipantsPageProps) {
  const { eventId } = await params
  const [user, event, participants] = await Promise.all([
    getCurrentUser(),
    getEventOrNotFound(eventId),
    getParticipantsOrNotFound(eventId),
  ])

  return (
    <div className='space-y-6'>
      <PageHero
        icon={UsersRound}
        eyebrow='Участники'
        title={event.title}
        description='Список организатора и подтвердивших участие пользователей.'
      />

      {participants.length ? (
        <div className='grid gap-3'>
          {participants.map((participant) => (
            <Card key={`${participant.role}-${participant.user.id}`} className='shadow-sm'>
              <CardContent className='flex flex-wrap items-center justify-between gap-4 p-5'>
                <div className='flex min-w-0 items-center gap-3'>
                  <span className='grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground'>
                    {participant.role === 'organizer' ? (
                      <Crown className='h-5 w-5' />
                    ) : (
                      <UsersRound className='h-5 w-5' />
                    )}
                  </span>
                  <div className='min-w-0'>
                    <p className='font-medium'>{participant.user.name}</p>
                    <p className='break-all text-sm text-muted-foreground'>{participant.user.email}</p>
                  </div>
                </div>
                <div className='flex flex-wrap items-center gap-2'>
                  <Badge variant={participant.role === 'organizer' ? 'default' : 'secondary'}>
                    {participant.role === 'organizer' ? 'Организатор' : participantStatusLabels.accepted}
                  </Badge>
                  {event.relation.isParticipant && participant.user.id === user.id ? (
                    <ParticipantActions eventId={event.id} participant={participant} mode='leave' />
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={UsersRound}
          title='Участников пока нет'
          description='После принятия приглашений участники появятся в списке.'
        />
      )}
    </div>
  )
}

async function getEventOrNotFound(eventId: string) {
  try {
    return await getEvent(eventId)
  } catch (error) {
    if (error instanceof ServerApiRequestError && [403, 404].includes(error.status)) {
      notFound()
    }

    throw error
  }
}

async function getParticipantsOrNotFound(eventId: string) {
  try {
    return await getParticipants(eventId)
  } catch (error) {
    if (error instanceof ServerApiRequestError && [403, 404].includes(error.status)) {
      notFound()
    }

    throw error
  }
}
