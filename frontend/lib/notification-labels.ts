import type { NotificationType } from './api'
import { formatLocalDate } from './date-format'

export const notificationTypeLabels: Record<NotificationType, string> = {
  event_invitation: 'Приглашение',
  event_updated: 'Изменение',
  event_cancelled: 'Отмена',
  participant_accepted: 'Принято',
  participant_declined: 'Отклонено',
}

export function formatNotificationDate(value: string) {
  return formatLocalDate(value, {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}
