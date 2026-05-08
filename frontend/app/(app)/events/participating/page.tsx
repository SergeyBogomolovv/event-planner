import { UsersRound } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import { EventCard } from '@/components/event-card'
import { PageHero } from '@/components/page-hero'
import { getParticipatingEvents } from '@/lib/server-api'

export default async function ParticipatingEventsPage() {
  const events = await getParticipatingEvents()

  return (
    <div className='space-y-6'>
      <PageHero
        icon={UsersRound}
        eyebrow='Участие'
        title='Я участвую'
        description='Здесь собраны мероприятия, где вы подтвердили участие.'
        className='bg-white text-zinc-950 ring-1 ring-border [&_p]:text-muted-foreground'
      />

      {events.length ? (
        <div className='grid gap-4'>
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={UsersRound}
          title='Список пока пуст'
          description='Здесь появятся мероприятия, где вы подтвердили участие.'
        />
      )}
    </div>
  )
}
