import Link from 'next/link'
import { ArrowRight, CalendarCheck, LockKeyhole, UsersRound } from 'lucide-react'

const metrics = [
  ['Draft', 'черновики без лишнего шума'],
  ['Invite', 'закрытые списки гостей'],
  ['Track', 'понятные статусы ответов'],
]

export default function Home() {
  return (
    <main className='min-h-screen overflow-hidden bg-[#f7f7f2] text-zinc-950'>
      <section className='mx-auto grid min-h-screen w-full max-w-7xl grid-rows-[auto_1fr] px-6 py-6'>
        <header className='flex items-center justify-between rounded-lg border border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur'>
          <Link href='/' className='text-lg font-semibold'>
            Event Planner
          </Link>
          <nav className='flex items-center gap-2 text-sm'>
            <Link className='rounded-md px-3 py-2 hover:bg-zinc-100' href='/login'>
              Войти
            </Link>
            <Link className='rounded-md bg-zinc-950 px-3 py-2 text-white' href='/register'>
              Регистрация
            </Link>
          </nav>
        </header>

        <div className='grid items-center gap-10 py-10 lg:grid-cols-[1fr_0.85fr]'>
          <section>
            <p className='text-sm font-medium uppercase tracking-[0.35em] text-emerald-700'>
              Private event operations
            </p>
            <h1 className='mt-5 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-normal sm:text-6xl lg:text-7xl'>
              Event Planner
            </h1>
            <p className='mt-6 max-w-2xl text-lg leading-8 text-zinc-650'>
              Закрытое рабочее пространство для организаторов: создавайте событие, приглашайте
              зарегистрированных пользователей и держите список участников под контролем.
            </p>
            <div className='mt-8 flex flex-wrap gap-3'>
              <Link
                className='inline-flex h-12 items-center gap-2 rounded-md bg-zinc-950 px-5 font-medium text-white hover:bg-zinc-800'
                href='/register'
              >
                Начать
                <ArrowRight className='h-4 w-4' />
              </Link>
              <Link
                className='inline-flex h-12 items-center rounded-md border border-zinc-300 bg-white px-5 font-medium hover:bg-zinc-100'
                href='/login'
              >
                Войти в кабинет
              </Link>
            </div>

            <div className='mt-12 grid max-w-3xl gap-3 sm:grid-cols-3'>
              {metrics.map(([title, text]) => (
                <div key={title} className='border-t border-zinc-300 pt-4'>
                  <p className='text-2xl font-semibold'>{title}</p>
                  <p className='mt-1 text-sm text-zinc-600'>{text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className='relative'>
            <div className='absolute -left-6 top-10 h-24 w-24 rounded-full bg-emerald-300/70 blur-2xl' />
            <div className='relative rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl shadow-zinc-300/60'>
              <div className='rounded-lg bg-zinc-950 p-5 text-white'>
                <div className='flex items-center justify-between'>
                  <p className='text-sm text-zinc-300'>Spring Strategy Dinner</p>
                  <span className='rounded-md bg-emerald-300 px-2 py-1 text-xs font-medium text-zinc-950'>
                    active
                  </span>
                </div>
                <p className='mt-8 text-3xl font-semibold'>24 приглашения</p>
                <div className='mt-5 grid grid-cols-3 gap-2 text-center text-sm'>
                  <div className='rounded-md bg-white/10 p-3'>
                    <p className='text-xl font-semibold'>14</p>
                    <p className='text-zinc-300'>accepted</p>
                  </div>
                  <div className='rounded-md bg-white/10 p-3'>
                    <p className='text-xl font-semibold'>7</p>
                    <p className='text-zinc-300'>pending</p>
                  </div>
                  <div className='rounded-md bg-white/10 p-3'>
                    <p className='text-xl font-semibold'>3</p>
                    <p className='text-zinc-300'>declined</p>
                  </div>
                </div>
              </div>

              <div className='mt-4 grid gap-3'>
                {[
                  [CalendarCheck, 'Жизненный цикл мероприятия', 'draft -> active -> completed'],
                  [UsersRound, 'Участники по приглашению', 'организатор видит статусы ответов'],
                  [LockKeyhole, 'Закрытый доступ', 'страницы защищены cookie-сессией'],
                ].map(([Icon, title, text]) => (
                  <div
                    key={String(title)}
                    className='flex gap-3 rounded-lg border border-zinc-200 p-4'
                  >
                    <Icon className='mt-1 h-5 w-5 shrink-0' />
                    <div>
                      <p className='font-medium'>{String(title)}</p>
                      <p className='mt-1 text-sm text-zinc-600'>{String(text)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}
