import { ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from '@/components/empty-state'
import { buttonVariants } from '@/components/ui/button'

export function NoAccess() {
  return (
    <EmptyState
      icon={ShieldAlert}
      title='Нет доступа'
      description='Этот раздел доступен только администраторам.'
      action={
        <Link href='/dashboard' className={buttonVariants()}>
          Вернуться в кабинет
        </Link>
      }
    />
  )
}
