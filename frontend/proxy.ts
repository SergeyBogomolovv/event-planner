import { NextRequest, NextResponse } from 'next/server'

const protectedRoutes = ['/dashboard', '/profile', '/events', '/invitations', '/notifications', '/admin']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasAccessToken = request.cookies.has('access_token')
  const hasRefreshToken = request.cookies.has('refresh_token')

  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !hasAccessToken) {
    if (hasRefreshToken) {
      const url = request.nextUrl.clone()
      url.pathname = '/api/auth/refresh'
      url.searchParams.set('next', `${pathname}${request.nextUrl.search}`)
      return NextResponse.redirect(url)
    }

    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
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
