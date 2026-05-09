import { EventForm } from '@/components/event-form'
import { PageHero } from '@/components/page-hero'

export default function NewEventPage() {
  return (
    <div className='space-y-6'>
      <PageHero
        eyebrow='Новое мероприятие'
        title='Создать черновик'
        description='Укажите основные детали. После создания мероприятие можно будет открыть, изменить или опубликовать.'
      />
      <EventForm mode='create' />
    </div>
  )
}
