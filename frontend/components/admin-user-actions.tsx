'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ban, RotateCcw } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type { CurrentUser } from '@/lib/api'
import { apiRequest } from '@/lib/api'

type AdminUserActionsProps = {
  user: CurrentUser
  currentUserId: string
}

export function AdminUserActions({ user, currentUserId }: AdminUserActionsProps) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const isBlocked = user.status === 'blocked'
  const isSelf = user.id === currentUserId
  const action = isBlocked ? 'unblock' : 'block'
  const label = isBlocked ? 'Разблокировать' : 'Заблокировать'

  async function submit() {
    setError('')

    if (!window.confirm(`${label} пользователя ${user.email}?`)) {
      return
    }

    setPending(true)
    try {
      await apiRequest<CurrentUser>(`/admin/users/${user.id}/${action}`, {
        method: 'PATCH',
      })
      router.refresh()
    } catch {
      setError('Не удалось изменить статус пользователя.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className='space-y-2'>
      <Button
        variant={isBlocked ? 'outline' : 'destructive'}
        size='sm'
        className='gap-2'
        disabled={pending || isSelf}
        onClick={submit}
      >
        {isBlocked ? <RotateCcw className='h-4 w-4' /> : <Ban className='h-4 w-4' />}
        {pending ? 'Сохраняем...' : label}
      </Button>
      {error ? (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
