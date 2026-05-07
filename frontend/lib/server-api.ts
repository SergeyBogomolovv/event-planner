import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { API_BASE_URL } from './api-config'
import type { CurrentUser } from './api'

type ServerApiOptions = {
  redirectToLogin?: boolean
}

export async function serverApiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: ServerApiOptions = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      cookie: await getCookieHeader(),
    },
    cache: init.cache ?? 'no-store',
  })

  if (!response.ok) {
    if (options.redirectToLogin) {
      redirect('/login')
    }
    throw new Error(`Server API request failed: ${response.status}`)
  }

  return response.json() as Promise<T>
}

export function getCurrentUser() {
  return serverApiRequest<CurrentUser>('/auth/me', {}, { redirectToLogin: true })
}

export function getProfile() {
  return serverApiRequest<CurrentUser>('/users/me', {}, { redirectToLogin: true })
}

async function getCookieHeader() {
  const cookieStore = await cookies()
  return cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ')
}
