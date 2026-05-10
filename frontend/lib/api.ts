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
  const response = await fetch(`${PUBLIC_API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new ApiRequestError(error || `API request failed: ${response.status}`, response.status)
  }

  return response.json() as Promise<T>
}
