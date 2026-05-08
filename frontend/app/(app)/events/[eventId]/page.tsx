import { CalendarDays, MapPin, UsersRound } from 'lucide-react'
import { notFound } from 'next/navigation'
import { EventActions } from '@/components/event-actions'
import { PageHero } from '@/components/page-hero'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { eventFormatLabels, eventStatusLabels, formatEventDate } from '@/lib/event-labels'
import { getEvent } from '@/lib/server-api'

type EventPageProps = {
  params: Promise<{ eventId: string }>
}

export default async function EventPage({ params }: EventPageProps) {
  const { eventId } = await params
  const event = await getEvent(eventId).catch(() => null)

  if (!event) {
    notFound()
  }

  return (
    <div className='space-y-6'>
      <PageHero
        eyebrow={eventStatusLabels[event.status]}
        title={event.title}
        description={event.description}
        action={<EventActions event={event} />}
      />

      <div className='grid gap-4 lg:grid-cols-[1fr_320px]'>
        <Card className='py-0 shadow-sm'>
          <CardHeader className='p-6 pb-0'>
            <CardTitle>Детали</CardTitle>
          </CardHeader>
          <CardContent className='grid gap-4 p-6 md:grid-cols-2'>
            <Info icon={<CalendarDays className='h-5 w-5' />} label='Начало' value={formatEventDate(event.startsAt)} />
            <Info
              icon={<CalendarDays className='h-5 w-5' />}
              label='Окончание'
              value={event.endsAt ? formatEventDate(event.endsAt) : 'Не указано'}
            />
            <Info icon={<MapPin className='h-5 w-5' />} label='Место' value={event.location || eventFormatLabels[event.format]} />
            <Info
              icon={<UsersRound className='h-5 w-5' />}
              label='Лимит'
              value={event.participantLimit ? `${event.participantLimit} мест` : 'Без лимита'}
            />
          </CardContent>
        </Card>

        <Card className='py-0 shadow-sm'>
          <CardHeader className='p-6 pb-0'>
            <CardTitle>Организатор</CardTitle>
          </CardHeader>
          <CardContent className='p-6'>
          <div className='rounded-lg bg-muted p-4'>
            <p className='font-medium'>{event.organizer.name}</p>
            <p className='mt-1 text-sm text-muted-foreground'>{event.organizer.email}</p>
          </div>
          <div className='mt-5 flex flex-wrap gap-2'>
            <Badge variant='outline'>{event.relation.isOrganizer ? 'Вы организатор' : 'Просмотр'}</Badge>
            <Badge variant='secondary'>{eventFormatLabels[event.format]}</Badge>
          </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className='rounded-lg bg-muted p-4 ring-1 ring-border/70'>
      <div className='flex items-center gap-2 text-muted-foreground'>
        {icon}
        <span className='text-xs uppercase tracking-[0.18em]'>{label}</span>
      </div>
      <p className='mt-3 font-medium'>{value}</p>
    </div>
  )
}
