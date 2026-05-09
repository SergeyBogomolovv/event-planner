'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCheck } from 'lucide-react'
import { apiRequest, type NotificationItem } from '@/lib/api'
import { Button } from '@/components/ui/button'

type NotificationReadButtonProps = {
  notification: NotificationItem
}

export function NotificationReadButton({ notification }: NotificationReadButtonProps) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  async function markRead() {
    setIsPending(true)
    try {
      await apiRequest<NotificationItem>(`/notifications/${notification.id}/read`, {
        method: 'PATCH',
      })
      router.refresh()
    } finally {
      setIsPending(false)
    }
  }

  if (notification.readAt) {
    return null
  }

  return (
    <Button variant='outline' size='sm' className='gap-2' disabled={isPending} onClick={markRead}>
      <CheckCheck className='h-4 w-4' />
      {isPending ? 'Отмечаем...' : 'Прочитано'}
    </Button>
  )
}
