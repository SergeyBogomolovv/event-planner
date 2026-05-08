import { CalendarDays, MapPin, UsersRound } from 'lucide-react'
import Link from 'next/link'
import type { EventItem } from '@/lib/api'
import { eventFormatLabels, eventStatusLabels, formatEventDate } from '@/lib/event-labels'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { EventActions } from './event-actions'

type EventCardProps = {
  event: EventItem
}

export function EventCard({ event }: EventCardProps) {
  return (
    <Card className='gap-0 py-0 shadow-sm'>
      <CardHeader className='gap-3 p-5'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div>
            <CardTitle>
              <Link href={`/events/${event.id}`} className='hover:text-teal-800'>
                {event.title}
              </Link>
            </CardTitle>
            <p className='mt-2 line-clamp-2 text-sm leading-6 text-zinc-600'>{event.description}</p>
          </div>
          <Badge variant='secondary'>{eventStatusLabels[event.status]}</Badge>
        </div>
      </CardHeader>

      <CardContent className='grid gap-3 px-5 pb-5 text-sm text-zinc-700 md:grid-cols-3'>
        <span className='flex items-center gap-2'>
          <CalendarDays className='h-4 w-4 text-zinc-500' />
          {formatEventDate(event.startsAt)}
        </span>
        <span className='flex items-center gap-2'>
          <MapPin className='h-4 w-4 text-zinc-500' />
          {event.location || eventFormatLabels[event.format]}
        </span>
        <span className='flex items-center gap-2'>
          <UsersRound className='h-4 w-4 text-zinc-500' />
          {event.participantLimit ? `${event.participantLimit} мест` : 'Без лимита'}
        </span>
      </CardContent>

      {event.availableActions.length ? (
        <CardFooter className='bg-white px-5 py-4'>
          <EventActions event={event} compact />
        </CardFooter>
      ) : null}
    </Card>
  )
}
