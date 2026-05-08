import Link from 'next/link'
import { Suspense } from 'react'
import { AuthForm } from '@/components/auth-form'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default function LoginPage() {
  return (
    <main className='grid min-h-screen bg-[linear-gradient(180deg,#f8faf7_0%,#eef4f1_100%)] md:grid-cols-[0.95fr_1.05fr]'>
      <section className='flex flex-col justify-between bg-zinc-950 p-8 text-white md:p-12'>
        <Link href='/' className='text-lg font-semibold'>
          Event Planner
        </Link>
        <div className='py-16'>
          <Badge variant='secondary' className='bg-teal-300 text-zinc-950 hover:bg-teal-300'>Закрытые события</Badge>
          <h1 className='mt-5 max-w-lg text-4xl font-semibold leading-tight sm:text-5xl'>
            Возвращайтесь к событиям, где важен каждый ответ.
          </h1>
          <p className='mt-5 max-w-md text-zinc-300'>
            Откройте кабинет, проверьте приглашения и продолжайте подготовку мероприятий без лишней
            суеты.
          </p>
        </div>
        <div className='grid grid-cols-3 gap-3 text-sm text-zinc-300'>
          {['Мои события', 'Приглашения', 'Профиль'].map((item) => (
            <span key={item} className='border-t border-zinc-700 pt-3'>{item}</span>
          ))}
        </div>
      </section>

      <section className='flex items-center justify-center p-6'>
        <Card className='w-full max-w-md py-0 shadow-xl shadow-zinc-200/70'>
          <CardHeader className='p-6 pb-0'>
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
