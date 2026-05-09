import type { CurrentUser } from './api'

export const userRoleLabels: Record<CurrentUser['role'], string> = {
  admin: 'Администратор',
  user: 'Пользователь',
}

export const userStatusLabels: Record<CurrentUser['status'], string> = {
  active: 'Активен',
  blocked: 'Заблокирован',
}
