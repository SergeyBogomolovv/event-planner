import { CalendarPlus } from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from '@/components/empty-state'
import { EventCard } from '@/components/event-card'
import { PageHero } from '@/components/page-hero'
import { buttonVariants } from '@/components/ui/button'
import { getMyEvents } from '@/lib/server-api'

export default async function MyEventsPage() {
  const events = await getMyEvents()

  return (
    <div className='space-y-6'>
      <PageHero
        icon={CalendarPlus}
        eyebrow='Мероприятия'
        title='Мои мероприятия'
        description='Ведите черновики, публикуйте события и управляйте их статусом.'
        action={
        <Link
          href='/events/new'
          className={buttonVariants({ variant: 'secondary', size: 'lg', className: 'gap-2' })}
        >
          <CalendarPlus className='h-4 w-4' />
          Создать
        </Link>
        }
      />

      {events.length ? (
        <div className='grid gap-4'>
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={CalendarPlus}
          title='Пока нет мероприятий'
          description='Создайте первое событие, сохраните его как черновик и опубликуйте, когда детали будут готовы.'
          action={
          <Link
            href='/events/new'
              className={buttonVariants({ size: 'lg', className: 'gap-2' })}
          >
            <CalendarPlus className='h-4 w-4' />
            Создать мероприятие
          </Link>
          }
        />
      )}
    </div>
  )
}
