const APP_LOCALE = 'ru-RU'
const APP_TIME_ZONE = 'Europe/Moscow'

export function formatLocalDate(
  value: string | Date,
  options: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat(APP_LOCALE, {
    timeZone: APP_TIME_ZONE,
    ...options,
  }).format(new Date(value))
}
