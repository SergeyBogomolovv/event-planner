'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, Loader2 } from 'lucide-react'
import { apiRequest, CurrentUser } from '@/lib/api'

type Mode = 'login' | 'register'

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function onSubmit(formData: FormData) {
    setError('')
    setPending(true)

    const payload =
      mode === 'register'
        ? {
            name: String(formData.get('name') ?? ''),
            email: String(formData.get('email') ?? ''),
            password: String(formData.get('password') ?? ''),
          }
        : {
            email: String(formData.get('email') ?? ''),
            password: String(formData.get('password') ?? ''),
          }

    try {
      await apiRequest<CurrentUser>(mode === 'register' ? '/auth/register' : '/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      router.push(searchParams.get('next') ?? '/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? normalizeError(err.message) : 'Не удалось выполнить вход')
    } finally {
      setPending(false)
    }
  }

  return (
    <form action={onSubmit} className='space-y-4'>
      {mode === 'register' ? (
        <label className='block'>
          <span className='text-sm font-medium text-zinc-700'>Имя</span>
          <input
            required
            name='name'
            className='mt-2 h-12 w-full rounded-md border border-zinc-300 bg-white px-4 outline-none focus:border-zinc-950'
            placeholder='Анна Организатор'
          />
        </label>
      ) : null}

      <label className='block'>
        <span className='text-sm font-medium text-zinc-700'>Email</span>
        <input
          required
          type='email'
          name='email'
          className='mt-2 h-12 w-full rounded-md border border-zinc-300 bg-white px-4 outline-none focus:border-zinc-950'
          placeholder='you@example.com'
        />
      </label>

      <label className='block'>
        <span className='text-sm font-medium text-zinc-700'>Пароль</span>
        <input
          required
          minLength={8}
          type='password'
          name='password'
          className='mt-2 h-12 w-full rounded-md border border-zinc-300 bg-white px-4 outline-none focus:border-zinc-950'
          placeholder='Минимум 8 символов'
        />
      </label>

      {error ? (
        <p className='rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>
          {error}
        </p>
      ) : null}

      <button
        type='submit'
        disabled={pending}
        className='flex h-12 w-full items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70'
      >
        {pending ? (
          <Loader2 className='h-4 w-4 animate-spin' />
        ) : (
          <ArrowRight className='h-4 w-4' />
        )}
        {mode === 'register' ? 'Создать аккаунт' : 'Войти'}
      </button>
    </form>
  )
}

function normalizeError(message: string) {
  if (message.includes('401')) return 'Неверный email или пароль.'
  if (message.includes('409')) return 'Этот email уже зарегистрирован.'
  if (message.includes('400')) return 'Проверьте заполнение формы.'
  return 'Сервер вернул ошибку. Проверьте данные и попробуйте снова.'
}
