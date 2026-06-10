import { cache } from 'react'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

/**
 * Single getUser() per request. Multiple parallel Server Components calling
 * auth.getUser() directly can race on token refresh (Supabase refresh tokens
 * are single-use), leaving some components with a null user while others
 * succeed — empty account pages and spurious login redirects.
 */
export const getAuthUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

/** Same cached user lookup, with redirect for protected routes. */
export const requireAuthUser = cache(async (loginNext = '/account/profile'): Promise<User> => {
  const user = await getAuthUser()
  if (!user) redirect(`/auth/login?redirectTo=${loginNext}`)
  return user
})
