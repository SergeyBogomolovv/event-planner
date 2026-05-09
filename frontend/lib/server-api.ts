import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { API_BASE_URL } from './api-config'
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
    if (options.redirectToLogin && response.status === 401) {
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

async function getCookieHeader() {
  const cookieStore = await cookies()
  return cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ')
}
