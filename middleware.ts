import { NextResponse, type NextRequest } from 'next/server'
import { checkSession } from './lib/supabase/middleware'

// Protects the Shelter Hub: /dashboard/* requires a Supabase session.
// Unauthenticated visitors are sent to /login with the intended destination preserved.
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { response, isAuthenticated } = await checkSession(request)
  if (!isAuthenticated) return redirectToLogin(request)
  return response
}

function redirectToLogin(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  url.search = ''
  url.searchParams.set('redirectedFrom', request.nextUrl.pathname)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
