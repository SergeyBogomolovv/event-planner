'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { ArrowRight } from 'lucide-react'
import { apiRequest, CurrentUser } from '@/lib/api'
import { applyValidationErrors } from '@/lib/form-errors'
import { loginSchema, registerSchema, type AuthFormValues } from '@/lib/form-schemas'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { ValidatedField } from '@/components/validated-field'

type Mode = 'login' | 'register'

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const form = useForm<AuthFormValues>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  })
  const [error, setError] = useState('')

  async function submit(values: AuthFormValues) {
    setError('')

    const schema = mode === 'register' ? registerSchema : loginSchema
    const parsed = schema.safeParse(values)
    if (!parsed.success) {
      applyValidationErrors<AuthFormValues>(parsed.error.issues, form.setError)
      return
    }

    const payload =
      mode === 'register'
        ? parsed.data
        : {
            email: parsed.data.email,
            password: parsed.data.password,
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
    }
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} className='space-y-4'>
      <FieldGroup>
        {mode === 'register' ? (
          <ValidatedField htmlFor='name' label='Имя' error={form.formState.errors.name?.message}>
            <Input
              id='name'
              className='h-12 bg-white'
              placeholder='Анна Организатор'
              aria-invalid={Boolean(form.formState.errors.name)}
              {...form.register('name')}
            />
          </ValidatedField>
        ) : null}

        <ValidatedField htmlFor='email' label='Email' error={form.formState.errors.email?.message}>
          <Input
            id='email'
            type='email'
            className='h-12 bg-white'
            placeholder='you@example.com'
            aria-invalid={Boolean(form.formState.errors.email)}
            {...form.register('email')}
          />
        </ValidatedField>

        <ValidatedField htmlFor='password' label='Пароль' error={form.formState.errors.password?.message}>
          <Input
            id='password'
            type='password'
            className='h-12 bg-white'
            placeholder='Минимум 8 символов'
            aria-invalid={Boolean(form.formState.errors.password)}
            {...form.register('password')}
          />
        </ValidatedField>
      </FieldGroup>

      {error ? (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Button type='submit' disabled={form.formState.isSubmitting} className='h-12 w-full gap-2'>
        {form.formState.isSubmitting ? <Spinner /> : <ArrowRight className='h-4 w-4' />}
        {mode === 'register' ? 'Создать аккаунт' : 'Войти'}
      </Button>
    </form>
  )
}

function normalizeError(message: string) {
  if (message.includes('401')) return 'Неверный email или пароль.'
  if (message.includes('409')) return 'Этот email уже зарегистрирован.'
  if (message.includes('400')) return 'Проверьте заполнение формы.'
  return 'Сервер вернул ошибку. Проверьте данные и попробуйте снова.'
}
