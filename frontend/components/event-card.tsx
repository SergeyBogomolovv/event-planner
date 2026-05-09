import { CalendarDays, MapPin, UsersRound } from 'lucide-react'
import Link from 'next/link'
import type { EventItem } from '@/lib/api'
import { eventFormatLabels, eventStatusLabels, formatEventDate } from '@/lib/event-labels'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { EventActions } from './event-actions'

type EventCardProps = {
  event: EventItem
}

export function EventCard({ event }: EventCardProps) {
  const accentClass = {
    draft: 'bg-zinc-300',
    active: 'bg-teal-300',
    cancelled: 'bg-red-300',
    completed: 'bg-amber-300',
  }[event.status]

  return (
    <Card className='relative gap-0 py-0 shadow-sm shadow-zinc-200/70 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-zinc-200/80'>
      <span className={cn('absolute inset-y-0 left-0 w-1.5', accentClass)} aria-hidden='true' />
      <CardHeader className='gap-3 p-5'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div className='min-w-0'>
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
        <span className='flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2'>
          <CalendarDays className='h-4 w-4 text-zinc-500' />
          {formatEventDate(event.startsAt)}
        </span>
        <span className='flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2'>
          <MapPin className='h-4 w-4 text-zinc-500' />
          {event.location || eventFormatLabels[event.format]}
        </span>
        <span className='flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2'>
          <UsersRound className='h-4 w-4 text-zinc-500' />
          {event.participantLimit ? `${event.participantLimit} мест` : 'Без лимита'}
        </span>
      </CardContent>

      {event.availableActions.length ? (
        <CardFooter className='bg-zinc-50/80 px-5 py-4'>
          <EventActions event={event} compact />
        </CardFooter>
      ) : null}
    </Card>
  )
}
