export const PUBLIC_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1'

export const SERVER_API_BASE_URL = process.env.SERVER_API_BASE_URL ?? PUBLIC_API_BASE_URL
