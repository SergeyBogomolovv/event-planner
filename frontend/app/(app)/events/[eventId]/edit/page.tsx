import Link from 'next/link'
import { EventForm } from '@/components/event-form'
import { PageHero } from '@/components/page-hero'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getEvent } from '@/lib/server-api'

type EditEventPageProps = {
  params: Promise<{ eventId: string }>
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { eventId } = await params
  const event = await getEvent(eventId)

  if (!event.availableActions.includes('edit')) {
    return (
      <Card className='py-0 shadow-sm'>
        <CardContent className='p-8'>
        <h1 className='text-2xl font-semibold'>Редактирование недоступно</h1>
        <p className='mt-3 max-w-xl text-muted-foreground'>Это мероприятие нельзя изменить из текущего состояния.</p>
        <Link
          href={`/events/${event.id}`}
          className={buttonVariants({ size: 'lg', className: 'mt-5' })}
        >
          Вернуться к мероприятию
        </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='space-y-6'>
      <PageHero
        eyebrow='Редактирование'
        title={event.title}
        description='Обновите детали мероприятия и сохраните изменения.'
      />
      <EventForm event={event} mode='edit' />
    </div>
  )
}
