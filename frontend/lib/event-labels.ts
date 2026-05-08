import type { EventFormat, EventStatus } from './api'

export const eventStatusLabels: Record<EventStatus, string> = {
  draft: 'Черновик',
  active: 'Опубликовано',
  cancelled: 'Отменено',
  completed: 'Завершено',
}

export const eventFormatLabels: Record<EventFormat, string> = {
  offline: 'Офлайн',
  online: 'Онлайн',
  hybrid: 'Гибрид',
}

export function formatEventDate(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function toDateTimeLocal(value: string | null) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 16)
}
