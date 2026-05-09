import Link from 'next/link'
import { Suspense } from 'react'
import { CalendarPlus, CheckCircle2, ShieldCheck, UsersRound } from 'lucide-react'
import { AuthForm } from '@/components/auth-form'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const features = [
  [CalendarPlus, 'Сначала черновик', 'Соберите детали и опубликуйте, когда всё готово.'],
  [UsersRound, 'Только приглашённые', 'Участники видят только доступные им события.'],
  [CheckCircle2, 'Понятные ответы', 'Статусы приглашений всегда под рукой.'],
]

export default function RegisterPage() {
  return (
    <main className='relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f8faf7_0%,#eef4f1_100%)] p-6'>
      <div className='pointer-events-none fixed inset-0 bg-[linear-gradient(90deg,rgba(24,24,27,0.04)_1px,transparent_1px),linear-gradient(180deg,rgba(24,24,27,0.04)_1px,transparent_1px)] bg-[size:56px_56px]' />

      <div className='relative mx-auto grid min-h-[calc(100vh-48px)] max-w-6xl overflow-hidden rounded-2xl border border-zinc-200 bg-white/90 shadow-xl shadow-zinc-200/70 backdrop-blur md:grid-cols-[1fr_0.9fr]'>
        <section className='flex flex-col justify-between p-8 md:p-10'>
          <Link href='/' className='flex items-center gap-3 text-lg font-semibold'>
            <span className='grid size-9 place-items-center rounded-lg bg-zinc-950 text-teal-200'>
              <CalendarPlus className='h-5 w-5' />
            </span>
            Event Planner
          </Link>

          <div className='py-12'>
            <Badge variant='outline' className='h-7 bg-white px-3'>
              Новый организатор
            </Badge>
            <h1 className='mt-5 max-w-xl text-4xl font-semibold leading-tight sm:text-5xl'>
              Создайте кабинет для закрытых мероприятий.
            </h1>
            <p className='mt-5 max-w-xl leading-7 text-zinc-600'>
              Начните с черновика, пригласите участников и управляйте ответами в одном месте.
            </p>

            <div className='mt-8 grid gap-3'>
              {features.map(([Icon, title, text]) => (
                <Card key={String(title)} className='bg-zinc-50/80 py-0'>
                  <CardContent className='flex items-start gap-4 p-4'>
                    <span className='grid size-10 shrink-0 place-items-center rounded-lg bg-zinc-950 text-teal-200'>
                      <Icon className='h-5 w-5' />
                    </span>
                    <div>
                      <p className='font-semibold'>{String(title)}</p>
                      <p className='mt-1 text-sm leading-6 text-zinc-600'>{String(text)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <p className='text-sm text-zinc-500'>После регистрации вы сразу попадёте в кабинет.</p>
        </section>

        <section className='flex items-center bg-zinc-950 p-6 text-white md:p-10'>
          <Card className='w-full bg-white py-0 text-zinc-950 shadow-2xl shadow-black/20'>
            <CardHeader className='p-6 pb-0'>
              <div className='mb-4 grid size-11 place-items-center rounded-xl bg-teal-300 text-zinc-950'>
                <ShieldCheck className='h-5 w-5' />
              </div>
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
