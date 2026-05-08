import Link from 'next/link'
import { ArrowRight, CalendarCheck, LockKeyhole, UsersRound } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const metrics = [
  ['Черновики', 'спокойная подготовка события'],
  ['Гости', 'закрытые списки участников'],
  ['Статусы', 'понятная картина по ответам'],
]

export default function Home() {
  return (
    <main className='min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f8faf7_0%,#eef4f1_55%,#f7f7f2_100%)] text-zinc-950'>
      <section className='mx-auto grid min-h-screen w-full max-w-7xl grid-rows-[auto_1fr] px-6 py-6'>
        <header className='flex items-center justify-between rounded-xl border border-zinc-200/80 bg-white/85 px-4 py-3 shadow-sm backdrop-blur'>
          <Link href='/' className='text-lg font-semibold'>
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

        <div className='grid items-center gap-10 py-10 lg:grid-cols-[1fr_0.85fr]'>
          <section>
            <Badge variant='outline' className='h-7 px-3'>Закрытые мероприятия</Badge>
            <h1 className='mt-5 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-normal sm:text-6xl lg:text-7xl'>
              Event Planner
            </h1>
            <p className='mt-6 max-w-2xl text-lg leading-8 text-zinc-650'>
              Закрытое рабочее пространство для организаторов: создавайте событие, приглашайте
              зарегистрированных пользователей и держите список участников под контролем.
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
                className={buttonVariants({ variant: 'outline', size: 'lg', className: 'h-12 px-5' })}
                href='/login'
              >
                Войти в кабинет
              </Link>
            </div>

            <div className='mt-12 grid max-w-3xl gap-3 sm:grid-cols-3'>
              {metrics.map(([title, text]) => (
                <div key={title} className='rounded-xl bg-white/70 p-4 ring-1 ring-zinc-200/80'>
                  <p className='text-xl font-semibold'>{title}</p>
                  <p className='mt-1 text-sm text-zinc-600'>{text}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <Card className='py-0 shadow-xl shadow-zinc-300/50'>
              <CardContent className='p-5'>
              <div className='rounded-xl bg-zinc-950 p-5 text-white'>
                <div className='flex items-center justify-between'>
                  <p className='text-sm text-zinc-300'>Стратегический ужин</p>
                  <Badge variant='secondary' className='bg-teal-300 text-zinc-950 hover:bg-teal-300'>Опубликовано</Badge>
                </div>
                <p className='mt-8 text-3xl font-semibold'>24 приглашения</p>
                <div className='mt-5 grid grid-cols-3 gap-2 text-center text-sm'>
                  <div className='rounded-md bg-white/10 p-3'>
                    <p className='text-xl font-semibold'>14</p>
                    <p className='text-zinc-300'>приняли</p>
                  </div>
                  <div className='rounded-md bg-white/10 p-3'>
                    <p className='text-xl font-semibold'>7</p>
                    <p className='text-zinc-300'>ожидают</p>
                  </div>
                  <div className='rounded-md bg-white/10 p-3'>
                    <p className='text-xl font-semibold'>3</p>
                    <p className='text-zinc-300'>отказались</p>
                  </div>
                </div>
              </div>

              <div className='mt-4 grid gap-3'>
                {[
                  [CalendarCheck, 'Подготовка события', 'черновик, публикация и завершение'],
                  [UsersRound, 'Участники по приглашению', 'организатор видит статусы ответов'],
                  [LockKeyhole, 'Закрытый доступ', 'страницы доступны только своим'],
                ].map(([Icon, title, text]) => (
                  <Card key={String(title)} className='py-0'>
                    <CardHeader className='flex-row items-start gap-3 p-4'>
                      <Icon className='mt-0.5 h-5 w-5 shrink-0' />
                      <div>
                        <CardTitle className='text-sm'>{String(title)}</CardTitle>
                        <p className='mt-1 text-sm text-muted-foreground'>{String(text)}</p>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
              <Separator className='my-4' />
              <p className='text-sm text-muted-foreground'>Вся работа с событиями собрана в одном кабинете.</p>
              </CardContent>
            </Card>
          </section>
        </div>
      </section>
    </main>
  )
}
