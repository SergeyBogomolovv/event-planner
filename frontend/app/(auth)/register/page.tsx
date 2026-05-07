import Link from 'next/link'
import { Suspense } from 'react'
import { CalendarPlus, ShieldCheck, UsersRound } from 'lucide-react'
import { AuthForm } from '@/components/auth-form'

export default function RegisterPage() {
  return (
    <main className='min-h-screen bg-[#f7f7f2] p-6'>
      <div className='mx-auto grid min-h-[calc(100vh-48px)] max-w-6xl overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl shadow-zinc-200/70 md:grid-cols-[1fr_0.9fr]'>
        <section className='flex flex-col justify-between p-8 md:p-10'>
          <Link href='/' className='text-lg font-semibold'>
            Event Planner
          </Link>
          <div className='py-12'>
            <p className='text-sm uppercase tracking-[0.3em] text-emerald-700'>New organizer</p>
            <h1 className='mt-5 max-w-xl text-4xl font-semibold leading-tight sm:text-5xl'>
              Создайте аккаунт и начните собирать закрытые мероприятия.
            </h1>
            <div className='mt-8 grid gap-3 sm:grid-cols-3'>
              {[
                [CalendarPlus, 'Черновики'],
                [UsersRound, 'Приглашения'],
                [ShieldCheck, 'Закрытый доступ'],
              ].map(([Icon, label]) => (
                <div key={String(label)} className='rounded-lg border border-zinc-200 p-4'>
                  <Icon className='h-5 w-5' />
                  <p className='mt-3 text-sm font-medium'>{String(label)}</p>
                </div>
              ))}
            </div>
          </div>
          <p className='text-sm text-zinc-500'>После регистрации вы сразу попадёте в кабинет.</p>
        </section>

        <section className='flex items-center bg-zinc-950 p-6 text-white md:p-10'>
          <div className='w-full rounded-lg bg-white p-6 text-zinc-950'>
            <h2 className='text-2xl font-semibold'>Регистрация</h2>
            <p className='mt-2 text-sm text-zinc-600'>Пароль должен быть не короче 8 символов.</p>
            <div className='mt-6'>
              <Suspense>
                <AuthForm mode='register' />
              </Suspense>
            </div>
            <p className='mt-5 text-sm text-zinc-600'>
              Уже есть аккаунт?{' '}
              <Link href='/login' className='font-medium text-zinc-950 underline'>
                Войти
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
