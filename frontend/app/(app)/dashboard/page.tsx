import { CalendarPlus, Inbox, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { PageHero } from '@/components/page-hero'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentUser } from '@/lib/server-api'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  return (
    <div className='space-y-6'>
      <PageHero
        icon={Sparkles}
        eyebrow='Сегодня'
        title={`Здравствуйте, ${user.name}`}
        description='Быстрый доступ к событиям, черновикам и профилю. Начните с нового мероприятия или вернитесь к текущим.'
      />

      <div className='grid gap-4 md:grid-cols-3'>
        {[
          [CalendarPlus, 'Мои мероприятия', 'Создавайте и ведите закрытые события', '/events/my'],
          [Inbox, 'Создать событие', 'Подготовьте черновик и опубликуйте его, когда всё готово', '/events/new'],
          [Sparkles, 'Профиль', 'Держите контактные данные в актуальном состоянии', '/profile'],
        ].map(([Icon, title, text, href]) => (
          <Card key={String(title)} className='py-0 transition-colors hover:ring-teal-300'>
            <Link href={String(href)} className='block p-5'>
              <CardHeader className='p-0'>
                <span className='grid size-10 place-items-center rounded-lg bg-muted text-muted-foreground'>
                  <Icon className='h-5 w-5' />
                </span>
                <CardTitle className='mt-4'>{String(title)}</CardTitle>
              </CardHeader>
              <CardContent className='p-0 pt-2 text-sm text-muted-foreground'>{String(text)}</CardContent>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  )
}
