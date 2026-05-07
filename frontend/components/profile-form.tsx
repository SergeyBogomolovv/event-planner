'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save } from 'lucide-react'
import { apiRequest, CurrentUser } from '@/lib/api'

export function ProfileForm({ user }: { user: CurrentUser }) {
  const router = useRouter()
  const [profile, setProfile] = useState(user)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function updateProfile(formData: FormData) {
    setMessage('')
    setError('')

    try {
      const updatedProfile = await apiRequest<CurrentUser>('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({
          name: String(formData.get('name') ?? ''),
          email: String(formData.get('email') ?? ''),
        }),
      })
      setProfile(updatedProfile)
      setMessage('Профиль обновлён')
      router.refresh()
    } catch {
      setError('Не удалось обновить профиль. Проверьте данные и попробуйте снова.')
    }
  }

  return (
    <form action={updateProfile} className='max-w-xl space-y-4'>
      <label className='block'>
        <span className='text-sm font-medium text-zinc-700'>Имя</span>
        <input
          required
          name='name'
          defaultValue={profile.name}
          className='mt-2 h-12 w-full rounded-md border border-zinc-300 px-4 outline-none focus:border-zinc-950'
        />
      </label>
      <label className='block'>
        <span className='text-sm font-medium text-zinc-700'>Email</span>
        <input
          required
          type='email'
          name='email'
          defaultValue={profile.email}
          className='mt-2 h-12 w-full rounded-md border border-zinc-300 px-4 outline-none focus:border-zinc-950'
        />
      </label>
      <button className='inline-flex h-11 items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white'>
        <Save className='h-4 w-4' />
        Сохранить
      </button>
      {message ? <p className='text-sm text-emerald-700'>{message}</p> : null}
      {error ? <p className='text-sm text-red-700'>{error}</p> : null}
    </form>
  )
}
