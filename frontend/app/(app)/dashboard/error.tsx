'use client'

import { RotateCcw } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <EmptyState
      icon={RotateCcw}
      title='Не удалось загрузить кабинет'
      description='Попробуйте обновить данные. Если ошибка повторится, проверьте доступность backend.'
      action={
        <Button onClick={() => reset()}>
          <RotateCcw className='h-4 w-4' />
          Обновить
        </Button>
      }
    />
  )
}
