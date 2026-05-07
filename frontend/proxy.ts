import { NextRequest, NextResponse } from 'next/server'

const protectedRoutes = ['/dashboard', '/profile']
const guestRoutes = ['/login', '/register']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasAccessToken = request.cookies.has('access_token')

  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !hasAccessToken) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (guestRoutes.includes(pathname) && hasAccessToken) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/login', '/register'],
}
