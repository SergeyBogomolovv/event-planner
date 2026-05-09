import Link from 'next/link'
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  MailOpen,
  UsersRound,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const metrics = [
  ['18', 'активных событий'],
  ['67', 'ответов гостей'],
  ['7', 'ожидают решения'],
]

const workflow = [
  [CalendarCheck, 'Черновик', 'Подготовьте программу и детали события.'],
  [MailOpen, 'Приглашения', 'Отправьте доступ только нужным участникам.'],
  [UsersRound, 'Контроль', 'Следите за ответами и списком гостей.'],
]

const guests = [
  ['Амиша', 'приняла', 'bg-teal-300 text-zinc-950'],
  ['Ксюшка', 'ожидает', 'bg-amber-200 text-zinc-950'],
  ['Егор', 'принял', 'bg-teal-300 text-zinc-950'],
]

export default function Home() {
  return (
    <main className='min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f8faf7_0%,#eef4f1_50%,#f7f7f2_100%)] text-zinc-950'>
      <div className='pointer-events-none fixed inset-0 bg-[linear-gradient(90deg,rgba(24,24,27,0.04)_1px,transparent_1px),linear-gradient(180deg,rgba(24,24,27,0.04)_1px,transparent_1px)] bg-[size:56px_56px]' />

      <section className='relative mx-auto grid min-h-screen w-full max-w-7xl grid-rows-[auto_1fr] px-6 py-6'>
        <header className='flex items-center justify-between rounded-xl border border-zinc-200/80 bg-white/85 px-4 py-3 shadow-sm backdrop-blur'>
          <Link href='/' className='flex items-center gap-3 text-lg font-semibold'>
            <span className='grid size-9 place-items-center rounded-lg bg-zinc-950 text-teal-200'>
              <CalendarCheck className='h-5 w-5' />
            </span>
            Event Planner
          </Link>
          <nav className='flex items-center gap-2 text-sm'>
            <Link className={buttonVariants({ variant: 'ghost', size: 'lg' })} href='/login'>
              Войти
            </Link>
            <Link className={buttonVariants({ size: 'lg' })} href='/register'>
              Регистрация
            </Link>
          </nav>
        </header>

        <div className='grid items-center gap-10 py-10 lg:grid-cols-[1fr_0.92fr]'>
          <section>
            <Badge variant='outline' className='h-7 border-zinc-300 bg-white/70 px-3'>
              Закрытые мероприятия
            </Badge>
            <h1 className='mt-5 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-normal sm:text-6xl lg:text-7xl'>
              Планируйте события без лишнего шума
            </h1>
            <p className='mt-6 max-w-2xl text-lg leading-8 text-zinc-600'>
              Создавайте закрытые мероприятия, приглашайте участников и держите статусы ответов в
              одном аккуратном кабинете.
            </p>
            <div className='mt-8 flex flex-wrap gap-3'>
              <Link
                className={buttonVariants({ size: 'lg', className: 'h-12 gap-2 px-5' })}
                href='/register'
              >
                Начать
                <ArrowRight className='h-4 w-4' />
              </Link>
              <Link
                className={buttonVariants({
                  variant: 'outline',
                  size: 'lg',
                  className: 'h-12 bg-white/75 px-5',
                })}
                href='/login'
              >
                Войти в кабинет
              </Link>
            </div>

            <div className='mt-12 grid max-w-3xl gap-3 sm:grid-cols-3'>
              {workflow.map(([Icon, title, text]) => (
                <Card key={String(title)} className='bg-white/75 py-0 shadow-sm'>
                  <CardContent className='p-4'>
                    <Icon className='h-5 w-5 text-teal-700' />
                    <p className='mt-3 font-semibold'>{String(title)}</p>
                    <p className='mt-1 text-sm leading-6 text-zinc-600'>{String(text)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className='relative'>
            <div className='rounded-2xl bg-zinc-950 p-4 text-white shadow-[0_24px_80px_rgba(15,23,42,0.24)] ring-1 ring-white/10'>
              <div className='rounded-xl border border-white/10 bg-white/[0.04] p-5'>
                <div className='flex flex-wrap items-start justify-between gap-4'>
                  <div>
                    <Badge className='bg-teal-300 text-zinc-950 hover:bg-teal-300'>
                      Опубликовано
                    </Badge>
                    <h2 className='mt-5 text-3xl font-semibold'>Стратегический ужин</h2>
                    <p className='mt-2 text-sm text-zinc-300'>27 мая, 19:00 · закрытый список</p>
                  </div>
                  <div className='grid size-14 place-items-center rounded-xl bg-white/10 text-teal-200 ring-1 ring-white/10'>
                    <LockKeyhole className='h-6 w-6' />
                  </div>
                </div>

                <div className='mt-8 grid grid-cols-3 gap-2'>
                  {metrics.map(([value, label]) => (
                    <div key={label} className='rounded-lg bg-white/10 p-3'>
                      <p className='text-2xl font-semibold'>{value}</p>
                      <p className='mt-1 text-xs leading-5 text-zinc-300'>{label}</p>
                    </div>
                  ))}
                </div>

                <div className='mt-5 space-y-2'>
                  {guests.map(([name, status, className]) => (
                    <div
                      key={name}
                      className='flex items-center justify-between rounded-lg bg-white/[0.06] px-3 py-3 ring-1 ring-white/10'
                    >
                      <div className='flex items-center gap-3'>
                        <span className='grid size-8 place-items-center rounded-lg bg-white/10 text-sm font-semibold'>
                          {name.slice(0, 1)}
                        </span>
                        <span className='font-medium'>{name}</span>
                      </div>
                      <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', className)}>
                        {status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className='mt-4 grid gap-3 sm:grid-cols-2'>
                <div className='rounded-xl bg-white p-4 text-zinc-950'>
                  <CheckCircle2 className='h-5 w-5 text-teal-700' />
                  <p className='mt-3 text-sm font-semibold'>Ответы обновляются сразу</p>
                  <p className='mt-1 text-sm text-zinc-600'>Организатор видит актуальный состав.</p>
                </div>
                <div className='rounded-xl bg-white p-4 text-zinc-950'>
                  <Clock3 className='h-5 w-5 text-teal-700' />
                  <p className='mt-3 text-sm font-semibold'>Черновики без спешки</p>
                  <p className='mt-1 text-sm text-zinc-600'>Публикуйте только готовые события.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}
