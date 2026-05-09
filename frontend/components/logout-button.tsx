'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { ApiRequestError, apiRequest } from '@/lib/api'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function logout() {
    setPending(true)
    try {
      await apiRequest<{ ok: true }>('/auth/logout', { method: 'POST' })
    } catch (error) {
      if (!(error instanceof ApiRequestError && error.status === 401)) {
        throw error
      }
    } finally {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <Button
      type='button'
      onClick={logout}
      disabled={pending}
      variant='outline'
      size='lg'
      className='gap-2'
    >
      <LogOut className='h-4 w-4' />
      Выйти
    </Button>
  )
}
