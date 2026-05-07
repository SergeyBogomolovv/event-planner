import Link from 'next/link'
import { Suspense } from 'react'
import { AuthForm } from '@/components/auth-form'

export default function LoginPage() {
  return (
    <main className='grid min-h-screen bg-[#f7f7f2] md:grid-cols-[0.95fr_1.05fr]'>
      <section className='flex flex-col justify-between bg-zinc-950 p-8 text-white md:p-12'>
        <Link href='/' className='text-lg font-semibold'>
          Event Planner
        </Link>
        <div className='py-16'>
          <p className='text-sm uppercase tracking-[0.3em] text-emerald-300'>Closed events</p>
          <h1 className='mt-5 max-w-lg text-4xl font-semibold leading-tight sm:text-5xl'>
            Возвращайтесь к событиям, где важен каждый ответ.
          </h1>
          <p className='mt-5 max-w-md text-zinc-300'>
            Откройте кабинет, проверьте приглашения и продолжайте подготовку мероприятий без лишней
            суеты.
          </p>
        </div>
        <div className='grid grid-cols-3 gap-3 text-sm text-zinc-300'>
          <span className='border-t border-zinc-700 pt-3'>Мои события</span>
          <span className='border-t border-zinc-700 pt-3'>Приглашения</span>
          <span className='border-t border-zinc-700 pt-3'>Профиль</span>
        </div>
      </section>

      <section className='flex items-center justify-center p-6'>
        <div className='w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-200/70'>
          <h2 className='text-2xl font-semibold'>Вход</h2>
          <p className='mt-2 text-sm text-zinc-600'>
            Введите email и пароль для доступа в кабинет.
          </p>
          <div className='mt-6'>
            <Suspense>
              <AuthForm mode='login' />
            </Suspense>
          </div>
          <p className='mt-5 text-sm text-zinc-600'>
            Нет аккаунта?{' '}
            <Link href='/register' className='font-medium text-zinc-950 underline'>
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}
