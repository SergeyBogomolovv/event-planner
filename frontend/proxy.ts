import { NextRequest, NextResponse } from 'next/server'

const protectedRoutes = ['/dashboard', '/profile', '/events', '/invitations', '/notifications', '/admin']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasAccessToken = request.cookies.has('access_token')
  const hasRefreshToken = request.cookies.has('refresh_token')

  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !hasAccessToken) {
    if (hasRefreshToken) {
      return redirectToPath(
        `/api/auth/refresh?next=${encodeURIComponent(`${pathname}${request.nextUrl.search}`)}`,
        request,
      )
    }

    return redirectToPath(`/login?next=${encodeURIComponent(pathname)}`, request)
  }

  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-current-path', `${pathname}${request.nextUrl.search}`)
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  return NextResponse.next()
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

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/events/:path*',
    '/invitations/:path*',
    '/notifications/:path*',
    '/admin/:path*',
  ],
}
