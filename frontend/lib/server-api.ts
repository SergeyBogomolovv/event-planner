import 'server-only'

import { cookies } from 'next/headers'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { SERVER_API_BASE_URL } from './api-config'
import type {
  AdminEventItem,
  AdminStats,
  CurrentUser,
  DashboardItem,
  EventItem,
  InvitationItem,
  NotificationItem,
  PaginatedResponse,
  ParticipantItem,
} from './api'

type ServerApiOptions = {
  redirectToLogin?: boolean
}

export class ServerApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'ServerApiRequestError'
  }
}

export async function serverApiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: ServerApiOptions = {},
): Promise<T> {
  const cookieStore = await cookies()
  const method = init.method?.toUpperCase() ?? 'GET'
  const response = await fetch(`${SERVER_API_BASE_URL}${path}`, {
    ...init,
    headers: buildServerHeaders(init.headers, method, cookieStore),
    cache: init.cache ?? 'no-store',
  })

  if (!response.ok) {
    if (options.redirectToLogin && response.status === 401) {
      await redirectToRefreshOrLogin()
    }
    throw new ServerApiRequestError(`Server API request failed: ${response.status}`, response.status)
  }

  return response.json() as Promise<T>
}

export function getCurrentUser() {
  return serverApiRequest<CurrentUser>('/auth/me', {}, { redirectToLogin: true })
}

export function getProfile() {
  return serverApiRequest<CurrentUser>('/users/me', {}, { redirectToLogin: true })
}

export function getDashboard() {
  return serverApiRequest<DashboardItem>('/dashboard', {}, { redirectToLogin: true })
}

export function getMyEvents() {
  return serverApiRequest<EventItem[]>('/events/my', {}, { redirectToLogin: true })
}

export function getParticipatingEvents() {
  return serverApiRequest<EventItem[]>('/events/participating', {}, { redirectToLogin: true })
}

export function getEvent(eventId: string) {
  return serverApiRequest<EventItem>(`/events/${eventId}`, {}, { redirectToLogin: true })
}

export function getInvitations() {
  return serverApiRequest<InvitationItem[]>('/invitations', {}, { redirectToLogin: true })
}

export function getParticipants(eventId: string) {
  return serverApiRequest<ParticipantItem[]>(
    `/events/${eventId}/participants`,
    {},
    { redirectToLogin: true },
  )
}

export function getManageParticipants(eventId: string) {
  return serverApiRequest<ParticipantItem[]>(
    `/events/${eventId}/participants/manage`,
    {},
    { redirectToLogin: true },
  )
}

export function getNotifications() {
  return serverApiRequest<NotificationItem[]>('/notifications', {}, { redirectToLogin: true })
}

export async function getUnreadNotificationsCount() {
  const response = await serverApiRequest<{ count: number }>(
    '/notifications/unread-count',
    {},
    { redirectToLogin: true },
  )
  return response.count
}

export function getAdminStats() {
  return serverApiRequest<AdminStats>('/admin/stats', {}, { redirectToLogin: true })
}

export function getAdminUsers(params: { page: number; limit: number }) {
  return serverApiRequest<PaginatedResponse<CurrentUser>>(
    `/admin/users?${toSearchParams(params)}`,
    {},
    { redirectToLogin: true },
  )
}

export function getAdminEvents(params: { page: number; limit: number }) {
  return serverApiRequest<PaginatedResponse<AdminEventItem>>(
    `/admin/events?${toSearchParams(params)}`,
    {},
    { redirectToLogin: true },
  )
}

function toSearchParams(params: Record<string, string | number>) {
  return new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value)]),
  ).toString()
}

function buildServerHeaders(
  headers: HeadersInit | undefined,
  method: string,
  cookieStore: Awaited<ReturnType<typeof cookies>>,
) {
  const requestHeaders = new Headers(headers)
  requestHeaders.set('cookie', getCookieHeader(cookieStore))

  if (requiresCsrf(method) && !requestHeaders.has('x-csrf-token')) {
    const csrfToken = cookieStore.get('csrf_token')?.value
    if (csrfToken) {
      requestHeaders.set('x-csrf-token', csrfToken)
    }
  }

  return requestHeaders
}

function requiresCsrf(method: string) {
  return !['GET', 'HEAD', 'OPTIONS'].includes(method)
}

function getCookieHeader(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return ['access_token', 'refresh_token', 'csrf_token']
    .map((name) => cookieStore.get(name))
    .filter((cookie): cookie is { name: string; value: string } => Boolean(cookie))
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ')
}

async function redirectToRefreshOrLogin(): Promise<never> {
  const requestHeaders = await headers()
  const currentPath = requestHeaders.get('x-current-path') ?? '/dashboard'
  const cookieStore = await cookies()

  if (cookieStore.has('refresh_token')) {
    redirect(`/api/auth/refresh?next=${encodeURIComponent(currentPath)}`)
  }

  redirect(`/login?next=${encodeURIComponent(currentPath)}`)
}
