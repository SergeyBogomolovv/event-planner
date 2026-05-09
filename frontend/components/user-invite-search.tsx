'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Send } from 'lucide-react'
import { useForm } from 'react-hook-form'
import type { CurrentUser, ParticipantItem } from '@/lib/api'
import { apiRequest } from '@/lib/api'
import { applyValidationErrors } from '@/lib/form-errors'
import { userSearchSchema, type UserSearchFormValues } from '@/lib/form-schemas'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { ValidatedField } from '@/components/validated-field'

type UserInviteSearchProps = {
  eventId: string
}

export function UserInviteSearch({ eventId }: UserInviteSearchProps) {
  const router = useRouter()
  const form = useForm<UserSearchFormValues>({ defaultValues: { query: '' } })
  const [users, setUsers] = useState<CurrentUser[]>([])
  const [pendingUserId, setPendingUserId] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function search(values: UserSearchFormValues) {
    setError('')
    const parsed = userSearchSchema.safeParse(values)
    if (!parsed.success) {
      applyValidationErrors<UserSearchFormValues>(parsed.error.issues, form.setError)
      return
    }

    try {
      const query = encodeURIComponent(parsed.data.query)
      setUsers(await apiRequest<CurrentUser[]>(`/users/search?q=${query}`))
    } catch {
      setError('Не удалось найти пользователей.')
    }
  }

  async function invite(userId: string) {
    setError('')
    setPendingUserId(userId)
    try {
      await apiRequest<ParticipantItem>(`/events/${eventId}/participants`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      })
      router.refresh()
    } catch {
      setError('Не удалось отправить приглашение.')
    } finally {
      setPendingUserId(null)
    }
  }

  return (
    <Card className='shadow-sm'>
      <CardHeader>
        <CardTitle>Пригласить участника</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <form onSubmit={form.handleSubmit(search)}>
          <FieldGroup>
            <ValidatedField htmlFor='user-search' label='Поиск' error={form.formState.errors.query?.message}>
              <div className='flex gap-2'>
                <Input
                  id='user-search'
                  className='h-11'
                  placeholder='Имя или email'
                  aria-invalid={Boolean(form.formState.errors.query)}
                  {...form.register('query')}
                />
                <Button type='submit' className='h-11 gap-2' disabled={form.formState.isSubmitting}>
                  <Search className='h-4 w-4' />
                  Найти
                </Button>
              </div>
            </ValidatedField>
          </FieldGroup>
        </form>

        {users.length ? (
          <div className='divide-y rounded-lg border'>
            {users.map((user) => (
              <div key={user.id} className='flex flex-wrap items-center justify-between gap-3 p-3'>
                <div className='min-w-0'>
                  <p className='font-medium'>{user.name}</p>
                  <p className='break-all text-sm text-muted-foreground'>{user.email}</p>
                </div>
                <Button
                  size='sm'
                  className='gap-2'
                  disabled={pendingUserId === user.id}
                  onClick={() => invite(user.id)}
                >
                  <Send className='h-4 w-4' />
                  {pendingUserId === user.id ? 'Отправка...' : 'Пригласить'}
                </Button>
              </div>
            ))}
          </div>
        ) : null}

        {error ? (
          <Alert variant='destructive'>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  )
}
