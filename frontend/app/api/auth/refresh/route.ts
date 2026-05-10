import { NextRequest, NextResponse } from 'next/server'
import { SERVER_API_BASE_URL } from '@/lib/api-config'
import { getSafeRedirectPath } from '@/lib/navigation'

export async function GET(request: NextRequest) {
  const nextPath = getSafeRedirectPath(request.nextUrl.searchParams.get('next'))
  const csrfToken = request.cookies.get('csrf_token')?.value
  const backendResponse = await fetch(`${SERVER_API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      cookie: getCookieHeader(request),
      ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
    },
    cache: 'no-store',
  })

  if (!backendResponse.ok) {
    return redirectToPath(`/login?next=${encodeURIComponent(nextPath)}`, request)
  }

  const response = redirectToPath(nextPath, request)
  for (const cookie of getSetCookieHeaders(backendResponse.headers)) {
    response.headers.append('set-cookie', cookie)
  }
  return response
}

function redirectToPath(path: string, request: NextRequest) {
  return NextResponse.redirect(resolvePublicUrl(path, request))
}

function resolvePublicUrl(path: string, request: NextRequest) {
  const host =
    request.headers.get('x-forwarded-host') ??
    request.headers.get('host') ??
    request.nextUrl.host
  const proto =
    request.headers.get('x-forwarded-proto') ??
    request.nextUrl.protocol.replace(':', '')

  return new URL(path, `${proto}://${host}`)
}

function getCookieHeader(request: NextRequest) {
  return ['refresh_token', 'csrf_token']
    .map((name) => request.cookies.get(name))
    .filter((cookie): cookie is { name: string; value: string } => Boolean(cookie))
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ')
}

function getSetCookieHeaders(headers: Headers) {
  const withGetSetCookie = headers as Headers & {
    getSetCookie?: () => string[]
  }
  return withGetSetCookie.getSetCookie?.() ?? [headers.get('set-cookie')].filter(Boolean)
}
