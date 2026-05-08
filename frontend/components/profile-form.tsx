'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Save } from 'lucide-react'
import { apiRequest, CurrentUser } from '@/lib/api'
import { applyValidationErrors } from '@/lib/form-errors'
import { profileSchema, type ProfileFormValues } from '@/lib/form-schemas'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { ValidatedField } from '@/components/validated-field'

export function ProfileForm({ user }: { user: CurrentUser }) {
  const router = useRouter()
  const form = useForm<ProfileFormValues>({
    defaultValues: {
      name: user.name,
      email: user.email,
    },
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function updateProfile(values: ProfileFormValues) {
    setMessage('')
    setError('')

    const parsed = profileSchema.safeParse(values)
    if (!parsed.success) {
      applyValidationErrors<ProfileFormValues>(parsed.error.issues, form.setError)
      return
    }

    try {
      const updatedProfile = await apiRequest<CurrentUser>('/users/me', {
        method: 'PATCH',
        body: JSON.stringify(parsed.data),
      })
      form.reset({
        name: updatedProfile.name,
        email: updatedProfile.email,
      })
      setMessage('Профиль обновлён')
      router.refresh()
    } catch {
      setError('Не удалось обновить профиль. Проверьте данные и попробуйте снова.')
    }
  }

  return (
    <form onSubmit={form.handleSubmit(updateProfile)} className='max-w-xl space-y-4'>
      <FieldGroup>
        <ValidatedField
          htmlFor='profile-name'
          label='Имя'
          error={form.formState.errors.name?.message}
        >
          <Input
            id='profile-name'
            className='h-12'
            placeholder='Иван Петров'
            aria-invalid={Boolean(form.formState.errors.name)}
            {...form.register('name')}
          />
        </ValidatedField>
        <ValidatedField
          htmlFor='profile-email'
          label='Email'
          error={form.formState.errors.email?.message}
        >
          <Input
            id='profile-email'
            type='email'
            className='h-12'
            placeholder='ivan@example.com'
            aria-invalid={Boolean(form.formState.errors.email)}
            {...form.register('email')}
          />
        </ValidatedField>
      </FieldGroup>

      <Button type='submit' disabled={form.formState.isSubmitting} className='h-11 gap-2'>
        {form.formState.isSubmitting ? <Spinner /> : <Save className='h-4 w-4' />}
        {form.formState.isSubmitting ? 'Сохранение...' : 'Сохранить'}
      </Button>
      {message ? <p className='text-sm text-emerald-700'>{message}</p> : null}
      {error ? (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </form>
  )
}
