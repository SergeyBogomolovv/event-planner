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
      )
    }

    return redirectToPath(`/login?next=${encodeURIComponent(pathname)}`)
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

function redirectToPath(path: string) {
  return new NextResponse(null, {
    status: 307,
    headers: {
      location: path,
    },
  })
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
