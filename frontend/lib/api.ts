import { PUBLIC_API_BASE_URL } from './api-config'

export type CurrentUser = {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
  status: 'active' | 'blocked'
  createdAt: string
  updatedAt: string
}

export type EventStatus = 'draft' | 'active' | 'cancelled' | 'completed'
export type EventFormat = 'offline' | 'online' | 'hybrid'
export type EventAction = 'edit' | 'publish' | 'cancel' | 'complete' | 'delete'
export type ParticipantStatus = 'invited' | 'accepted' | 'declined' | 'removed'
export type NotificationType =
  | 'event_invitation'
  | 'event_updated'
  | 'event_cancelled'
  | 'participant_accepted'
  | 'participant_declined'

export type EventItem = {
  id: string
  title: string
  description: string
  startsAt: string
  endsAt: string | null
  location: string | null
  format: EventFormat
  participantLimit: number | null
  status: EventStatus
  organizer: CurrentUser
  relation: {
    isOrganizer: boolean
    isInvited: boolean
    isParticipant: boolean
    isAdmin: boolean
  }
  availableActions: EventAction[]
  createdAt: string
  updatedAt: string
}

export type ParticipantItem = {
  id: string
  role: 'organizer' | 'participant'
  status: ParticipantStatus | 'accepted'
  user: CurrentUser
  invitedBy: CurrentUser | null
  invitedAt: string | null
  respondedAt: string | null
  removedAt: string | null
  createdAt: string | null
  updatedAt: string | null
}

export type InvitationItem = {
  id: string
  status: ParticipantStatus
  event: EventItem
  invitedBy: CurrentUser
  invitedAt: string
  respondedAt: string | null
  createdAt: string
  updatedAt: string
}

export type NotificationItem = {
  id: string
  type: NotificationType
  title: string
  message: string
  relatedEventId: string | null
  relatedEvent: EventItem | null
  readAt: string | null
  createdAt: string
}

export type DashboardItem = {
  counts: {
    createdEvents: number
    participatingEvents: number
    pendingInvitations: number
    unreadNotifications: number
  }
  upcomingEvents: EventItem[]
  createdEvents: EventItem[]
  participatingEvents: EventItem[]
  pendingInvitations: InvitationItem[]
  unreadNotifications: NotificationItem[]
}

export type AdminStats = {
  users: {
    total: number
    byRole: Record<CurrentUser['role'], number>
    byStatus: Record<CurrentUser['status'], number>
  }
  events: {
    total: number
    byStatus: Record<EventStatus, number>
  }
  participants: {
    total: number
    byStatus: Record<ParticipantStatus, number>
  }
}

export type AdminEventItem = EventItem & {
  participantCount: number
}

export type PaginatedResponse<T> = {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'ApiRequestError'
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  return apiRequestWithRefresh<T>(path, init, false)
}

async function apiRequestWithRefresh<T>(
  path: string,
  init: RequestInit,
  alreadyRefreshed: boolean,
): Promise<T> {
  const response = await fetchApi(path, init)
  if (response.status === 401 && !alreadyRefreshed && shouldAttemptRefresh(path)) {
    await parseApiResponse<CurrentUser>(await fetchApi('/auth/refresh', { method: 'POST' }))
    return apiRequestWithRefresh<T>(path, init, true)
  }

  return parseApiResponse<T>(response)
}

async function fetchApi(path: string, init: RequestInit = {}) {
  const method = init.method?.toUpperCase() ?? 'GET'
  return fetch(`${PUBLIC_API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: buildHeaders(init.headers, method, init.body),
  })
}

async function parseApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.text()
    throw new ApiRequestError(error || `API request failed: ${response.status}`, response.status)
  }

  return response.json() as Promise<T>
}

function buildHeaders(headers: HeadersInit | undefined, method: string, body?: BodyInit | null) {
  const requestHeaders = new Headers(headers)
  if (body !== undefined && shouldSetJsonContentType(body) && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  if (requiresCsrf(method) && !requestHeaders.has('x-csrf-token')) {
    const csrfToken = readCookie('csrf_token')
    if (csrfToken) {
      requestHeaders.set('x-csrf-token', csrfToken)
    }
  }

  return requestHeaders
}

function shouldSetJsonContentType(body: BodyInit | null) {
  return (
    body !== null &&
    !(body instanceof FormData) &&
    !(body instanceof URLSearchParams) &&
    !(body instanceof Blob)
  )
}

function requiresCsrf(method: string) {
  return !['GET', 'HEAD', 'OPTIONS'].includes(method)
}

function shouldAttemptRefresh(path: string) {
  return !['/auth/login', '/auth/register', '/auth/refresh'].includes(path)
}

function readCookie(name: string) {
  if (typeof document === 'undefined') {
    return null
  }

  return (
    document.cookie
      .split('; ')
      .find((cookie) => cookie.startsWith(`${encodeURIComponent(name)}=`))
      ?.split('=')
      .slice(1)
      .join('=') ?? null
  )
}
