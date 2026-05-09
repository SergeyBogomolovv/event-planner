import type { ParticipantStatus } from './api'
import { formatLocalDate } from './date-format'

export const participantStatusLabels: Record<ParticipantStatus, string> = {
  invited: 'Приглашён',
  accepted: 'Участвует',
  declined: 'Отклонил',
  removed: 'Удалён',
}

export function formatParticipantDate(value: string | null) {
  if (!value) {
    return 'Не указано'
  }

  return formatLocalDate(value, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
