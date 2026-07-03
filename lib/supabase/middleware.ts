import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

interface SessionCheck {
  readonly response: NextResponse
  readonly isAuthenticated: boolean
}

interface ResponseHolder {
  response: NextResponse
}

interface CookieToSet {
  readonly name: string
  readonly value: string
  readonly options: CookieOptions
}

// Refreshes the Supabase session cookies and reports whether a user is logged in.
// Cookie plumbing follows the @supabase/ssr middleware pattern:
// https://supabase.com/docs/guides/auth/server-side/nextjs
export async function checkSession(request: NextRequest): Promise<SessionCheck> {
  const holder: ResponseHolder = { response: NextResponse.next({ request }) }
  const supabase = createMiddlewareClient(request, holder)
  const { data } = await supabase.auth.getUser()
  return { response: holder.response, isAuthenticated: data.user !== null }
}

// NEXT_PUBLIC_* vars must be referenced statically — Next.js inlines them at
// build time and dynamic process.env[name] lookups come back undefined on Edge.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function createMiddlewareClient(request: NextRequest, holder: ResponseHolder) {
  return createServerClient(
    requireValue('NEXT_PUBLIC_SUPABASE_URL', SUPABASE_URL),
    requireValue('NEXT_PUBLIC_SUPABASE_ANON_KEY', SUPABASE_ANON_KEY),
    { cookies: cookieAdapter(request, holder) }
  )
}

function cookieAdapter(request: NextRequest, holder: ResponseHolder) {
  return {
    getAll: () => request.cookies.getAll(),
    setAll: (cookies: CookieToSet[]) => applyCookies(request, holder, cookies),
  }
}

function applyCookies(request: NextRequest, holder: ResponseHolder, cookies: CookieToSet[]): void {
  cookies.forEach(({ name, value }) => request.cookies.set(name, value))
  holder.response = NextResponse.next({ request })
  cookies.forEach(({ name, value, options }) => holder.response.cookies.set(name, value, options))
}

function requireValue(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}
