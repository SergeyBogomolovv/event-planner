import Link from 'next/link'
import { Suspense } from 'react'
import { CalendarPlus, ShieldCheck, UsersRound } from 'lucide-react'
import { AuthForm } from '@/components/auth-form'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default function RegisterPage() {
  return (
    <main className='min-h-screen bg-[linear-gradient(180deg,#f8faf7_0%,#eef4f1_100%)] p-6'>
      <div className='mx-auto grid min-h-[calc(100vh-48px)] max-w-6xl overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl shadow-zinc-200/70 md:grid-cols-[1fr_0.9fr]'>
        <section className='flex flex-col justify-between p-8 md:p-10'>
          <Link href='/' className='text-lg font-semibold'>
            Event Planner
          </Link>
          <div className='py-12'>
            <Badge variant='outline' className='h-7 px-3'>
              Новый организатор
            </Badge>
            <h1 className='mt-5 max-w-xl text-4xl font-semibold leading-tight sm:text-5xl'>
              Создайте аккаунт и начните собирать закрытые мероприятия.
            </h1>
            <div className='mt-8 grid gap-3 sm:grid-cols-3'>
              {[
                [CalendarPlus, 'Черновики'],
                [UsersRound, 'Приглашения'],
                [ShieldCheck, 'Закрытый доступ'],
              ].map(([Icon, label]) => (
                <Card key={String(label)} className='py-0'>
                  <CardContent className='p-4'>
                    <Icon className='h-5 w-5' />
                    <p className='mt-3 text-sm font-medium'>{String(label)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <p className='text-sm text-zinc-500'>После регистрации вы сразу попадёте в кабинет.</p>
        </section>

        <section className='flex items-center bg-zinc-950 p-6 text-white md:p-10'>
          <Card className='w-full py-0 text-zinc-950'>
            <CardHeader className='p-6 pb-0'>
              <CardTitle className='text-2xl'>Регистрация</CardTitle>
              <p className='text-sm text-muted-foreground'>
                Пароль должен быть не короче 8 символов.
              </p>
            </CardHeader>
            <CardContent className='p-6'>
              <Suspense>
                <AuthForm mode='register' />
              </Suspense>
              <Separator className='my-5' />
              <p className='mt-5 text-sm text-zinc-600'>
                Уже есть аккаунт?{' '}
                <Link href='/login' className='font-medium text-zinc-950 underline'>
                  Войти
                </Link>
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
