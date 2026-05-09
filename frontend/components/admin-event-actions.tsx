'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { apiRequest } from '@/lib/api'

type AdminEventActionsProps = {
  eventId: string
  title: string
}

export function AdminEventActions({ eventId, title }: AdminEventActionsProps) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    setError('')

    if (!window.confirm(`Удалить мероприятие "${title}"?`)) {
      return
    }

    setPending(true)
    try {
      await apiRequest<{ ok: true }>(`/events/${eventId}`, { method: 'DELETE' })
      router.refresh()
    } catch {
      setError('Не удалось удалить мероприятие.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className='space-y-2'>
      <Button variant='destructive' size='sm' className='gap-2' disabled={pending} onClick={submit}>
        <Trash2 className='h-4 w-4' />
        {pending ? 'Удаляем...' : 'Удалить'}
      </Button>
      {error ? (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
