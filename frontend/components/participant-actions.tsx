'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Trash2 } from 'lucide-react'
import type { ParticipantItem } from '@/lib/api'
import { apiRequest } from '@/lib/api'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

type ParticipantActionsProps = {
  eventId: string
  participant: ParticipantItem
  mode: 'leave' | 'remove'
}

export function ParticipantActions({ eventId, participant, mode }: ParticipantActionsProps) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function runAction() {
    setError('')
    if (mode === 'remove' && !window.confirm('Удалить участника из мероприятия?')) {
      return
    }

    setPending(true)
    try {
      if (mode === 'remove') {
        await apiRequest<ParticipantItem>(`/events/${eventId}/participants/${participant.user.id}`, {
          method: 'DELETE',
        })
      } else {
        await apiRequest<ParticipantItem>(`/events/${eventId}/participants/${participant.user.id}/leave`, {
          method: 'POST',
        })
        router.push('/events/participating')
        router.refresh()
        return
      }
      router.refresh()
    } catch {
      setError(mode === 'remove' ? 'Не удалось удалить участника.' : 'Не удалось отказаться от участия.')
    } finally {
      setPending(false)
    }
  }

  const Icon = mode === 'remove' ? Trash2 : LogOut

  return (
    <div className='space-y-2'>
      <Button
        variant={mode === 'remove' ? 'destructive' : 'outline'}
        size='sm'
        className='gap-2'
        disabled={pending}
        onClick={runAction}
      >
        <Icon className='h-4 w-4' />
        {pending ? 'Сохранение...' : mode === 'remove' ? 'Удалить' : 'Выйти'}
      </Button>
      {error ? (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
