import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { safeNext } from '@/lib/safe-redirect'

/**
 * Auth callback: exchanges the `code` from email confirmation / password-reset
 * links for a session, then redirects to `next` (defaults to /account).
 * Required for the @supabase/ssr (PKCE) flow.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNext(searchParams.get('next')) ?? '/account'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent('Link expired or invalid. Please try again.')}`)
  }

  return NextResponse.redirect(`${origin}/auth/login`)
}
