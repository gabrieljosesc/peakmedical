import { cache } from 'react'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export const getSupabase = cache(async () => createClient())

/**
 * Read the session from cookies — no Auth server round-trip.
 *
 * The proxy already calls getUser() once per request to refresh tokens.
 * Calling getUser() again in Server Components races on Supabase's single-use
 * refresh token and can falsely return null (empty pages / login redirects
 * while the navbar still shows the user).
 */
export const getAuthUser = cache(async (): Promise<User | null> => {
  const supabase = await getSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user ?? null
})

/** Gate protected routes. Call only from layouts / route handlers. */
export async function requireAuthUser(loginNext = '/account/profile'): Promise<User> {
  const user = await getAuthUser()
  if (!user) redirect(`/auth/login?redirectTo=${loginNext}`)
  return user
}

/** Account child pages — layout already enforced auth. */
export const getAccountUser = cache(async (): Promise<User> => {
  const user = await getAuthUser()
  return user!
})
