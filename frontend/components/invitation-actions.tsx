'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle } from 'lucide-react'
import type { InvitationItem, ParticipantItem } from '@/lib/api'
import { apiRequest } from '@/lib/api'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

type InvitationActionsProps = {
  invitation: InvitationItem
  currentUserId: string
}

type InvitationAction = 'accept' | 'decline'

export function InvitationActions({ invitation, currentUserId }: InvitationActionsProps) {
  const router = useRouter()
  const [pendingAction, setPendingAction] = useState<InvitationAction | null>(null)
  const [error, setError] = useState('')

  async function runAction(action: InvitationAction) {
    setError('')
    setPendingAction(action)
    try {
      await apiRequest<ParticipantItem>(
        `/events/${invitation.event.id}/participants/${currentUserId}/${action}`,
        { method: 'POST' },
      )
      router.refresh()
    } catch {
      setError('Не удалось обновить приглашение.')
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap gap-2'>
        <Button
          className='gap-2'
          disabled={pendingAction !== null}
          onClick={() => runAction('accept')}
        >
          <CheckCircle2 className='h-4 w-4' />
          {pendingAction === 'accept' ? 'Принятие...' : 'Принять'}
        </Button>
        <Button
          variant='outline'
          className='gap-2'
          disabled={pendingAction !== null}
          onClick={() => runAction('decline')}
        >
          <XCircle className='h-4 w-4' />
          {pendingAction === 'decline' ? 'Отклонение...' : 'Отклонить'}
        </Button>
      </div>
      {error ? (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
