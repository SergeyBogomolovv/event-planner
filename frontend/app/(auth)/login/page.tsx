import Link from 'next/link'
import { Suspense } from 'react'
import { CalendarDays, CheckCircle2, MailOpen, ShieldCheck } from 'lucide-react'
import { AuthForm } from '@/components/auth-form'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const previewItems = [
  ['Сегодня', 'Проверить приглашения', MailOpen],
  ['19:00', 'Стратегический ужин', CalendarDays],
  ['Готово', '14 участников приняли', CheckCircle2],
]

export default function LoginPage() {
  return (
    <main className='relative grid min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f8faf7_0%,#eef4f1_100%)] md:grid-cols-[0.98fr_1.02fr]'>
      <div className='pointer-events-none fixed inset-0 bg-[linear-gradient(90deg,rgba(24,24,27,0.04)_1px,transparent_1px),linear-gradient(180deg,rgba(24,24,27,0.04)_1px,transparent_1px)] bg-[size:56px_56px]' />

      <section className='relative flex flex-col justify-between bg-zinc-950 p-8 text-white md:p-12'>
        <Link href='/' className='flex items-center gap-3 text-lg font-semibold'>
          <span className='grid size-9 place-items-center rounded-lg bg-white/10 text-teal-200'>
            <CalendarDays className='h-5 w-5' />
          </span>
          Event Planner
        </Link>

        <div className='py-16'>
          <Badge variant='secondary' className='bg-teal-300 text-zinc-950 hover:bg-teal-300'>
            Кабинет организатора
          </Badge>
          <h1 className='mt-5 max-w-lg text-4xl font-semibold leading-tight sm:text-5xl'>
            Возвращайтесь туда, где всё уже разложено по статусам.
          </h1>
          <p className='mt-5 max-w-md leading-7 text-zinc-300'>
            Проверьте приглашения, ближайшие события и обновления участников без лишних переходов.
          </p>

          <div className='mt-8 max-w-md rounded-2xl border border-white/10 bg-white/[0.06] p-3'>
            {previewItems.map(([time, title, Icon]) => (
              <div
                key={String(title)}
                className='flex items-center gap-3 rounded-xl px-3 py-3 text-sm'
              >
                <span className='grid size-9 place-items-center rounded-lg bg-white/10 text-teal-200'>
                  <Icon className='h-4 w-4' />
                </span>
                <span className='w-16 text-zinc-400'>{String(time)}</span>
                <span className='font-medium'>{String(title)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className='grid grid-cols-3 gap-3 text-sm text-zinc-300'>
          {['События', 'Приглашения', 'Уведомления'].map((item) => (
            <span key={item} className='border-t border-zinc-700 pt-3'>
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className='relative flex items-center justify-center p-6'>
        <Card className='w-full max-w-md bg-white/90 py-0 shadow-xl shadow-zinc-200/70 backdrop-blur'>
          <CardHeader className='p-6 pb-0'>
            <div className='mb-4 grid size-11 place-items-center rounded-xl bg-zinc-950 text-teal-200'>
              <ShieldCheck className='h-5 w-5' />
            </div>
            <CardTitle className='text-2xl'>Вход</CardTitle>
            <p className='text-sm text-muted-foreground'>Введите email и пароль для доступа в кабинет.</p>
          </CardHeader>
          <CardContent className='p-6'>
            <Suspense>
              <AuthForm mode='login' />
            </Suspense>
            <Separator className='my-5' />
            <p className='mt-5 text-sm text-zinc-600'>
              Нет аккаунта?{' '}
              <Link href='/register' className='font-medium text-zinc-950 underline'>
                Зарегистрироваться
              </Link>
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
