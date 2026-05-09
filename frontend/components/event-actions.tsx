'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Megaphone, Pencil, Trash2, XCircle } from 'lucide-react'
import Link from 'next/link'
import type { EventAction, EventItem } from '@/lib/api'
import { apiRequest } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button, buttonVariants } from '@/components/ui/button'

type EventActionsProps = {
  event: EventItem
  compact?: boolean
}

const actionLabels: Record<EventAction, string> = {
  edit: 'Редактировать',
  publish: 'Опубликовать',
  cancel: 'Отменить',
  complete: 'Завершить',
  delete: 'Удалить',
}

export function EventActions({ event, compact = false }: EventActionsProps) {
  const router = useRouter()
  const [pendingAction, setPendingAction] = useState<EventAction | null>(null)
  const [error, setError] = useState('')

  async function runAction(action: Exclude<EventAction, 'edit'>) {
    setError('')

    if (
      ['cancel', 'complete', 'delete'].includes(action) &&
      !window.confirm(`Подтвердите действие: ${actionLabels[action].toLowerCase()}`)
    ) {
      return
    }

    setPendingAction(action)
    try {
      if (action === 'delete') {
        await apiRequest<{ ok: true }>(`/events/${event.id}`, { method: 'DELETE' })
        router.push('/events/my')
      } else {
        await apiRequest<EventItem>(`/events/${event.id}/${action}`, { method: 'POST' })
        router.refresh()
      }
    } catch {
      setError('Не удалось выполнить действие.')
    } finally {
      setPendingAction(null)
    }
  }

  const size = compact ? 'sm' : 'lg'
  const outlineClass =
    'border-white/25 bg-white text-zinc-950 hover:bg-zinc-100 hover:text-zinc-950'
  const linkClass = cn(
    buttonVariants({ variant: 'outline', size }),
    'gap-2',
    !compact && outlineClass,
  )
  const outlineButtonClass = cn('gap-2', !compact && outlineClass)

  return (
    <div className='space-y-2'>
      <div className='flex flex-wrap gap-2'>
        {event.availableActions.includes('edit') ? (
          <Link href={`/events/${event.id}/edit`} className={linkClass}>
            <Pencil className='h-4 w-4' />
            {actionLabels.edit}
          </Link>
        ) : null}
        {event.availableActions.includes('publish') ? (
          <Button
            variant='outline'
            size={size}
            className={outlineButtonClass}
            disabled={pendingAction === 'publish'}
            onClick={() => runAction('publish')}
          >
            <Megaphone className='h-4 w-4' />
            {pendingAction === 'publish' ? 'Публикация...' : actionLabels.publish}
          </Button>
        ) : null}
        {event.availableActions.includes('cancel') ? (
          <Button
            variant='outline'
            size={size}
            className={outlineButtonClass}
            disabled={pendingAction === 'cancel'}
            onClick={() => runAction('cancel')}
          >
            <XCircle className='h-4 w-4' />
            {pendingAction === 'cancel' ? 'Отмена...' : actionLabels.cancel}
          </Button>
        ) : null}
        {event.availableActions.includes('complete') ? (
          <Button
            variant='outline'
            size={size}
            className={outlineButtonClass}
            disabled={pendingAction === 'complete'}
            onClick={() => runAction('complete')}
          >
            <CheckCircle2 className='h-4 w-4' />
            {pendingAction === 'complete' ? 'Завершение...' : actionLabels.complete}
          </Button>
        ) : null}
        {event.availableActions.includes('delete') ? (
          <Button
            variant='destructive'
            size={size}
            className='gap-2'
            disabled={pendingAction === 'delete'}
            onClick={() => runAction('delete')}
          >
            <Trash2 className='h-4 w-4' />
            {pendingAction === 'delete' ? 'Удаление...' : actionLabels.delete}
          </Button>
        ) : null}
      </div>
      {error ? (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
