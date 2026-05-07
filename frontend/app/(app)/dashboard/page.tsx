import { CalendarPlus, Inbox, Sparkles } from 'lucide-react'
import { getCurrentUser } from '@/lib/server-api'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  return (
    <div className='space-y-6'>
      <section className='rounded-xl bg-zinc-950 p-8 text-white'>
        <p className='text-sm uppercase tracking-[0.3em] text-emerald-300'>Dashboard</p>
        <h1 className='mt-4 text-3xl font-semibold'>Здравствуйте, {user.name}</h1>
        <p className='mt-3 max-w-2xl text-zinc-300'>
          Здесь будет собрана ваша рабочая сводка: созданные мероприятия, приглашения и последние
          изменения.
        </p>
      </section>

      <div className='grid gap-4 md:grid-cols-3'>
        {[
          [CalendarPlus, 'Мои мероприятия', 'Создавайте и ведите закрытые события'],
          [Inbox, 'Приглашения', 'Отвечайте на входящие приглашения'],
          [Sparkles, 'Уведомления', 'Следите за важными изменениями'],
        ].map(([Icon, title, text]) => (
          <div key={String(title)} className='rounded-lg border border-zinc-200 bg-white p-5'>
            <Icon className='h-5 w-5' />
            <h2 className='mt-4 font-semibold'>{String(title)}</h2>
            <p className='mt-2 text-sm text-zinc-600'>{String(text)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
