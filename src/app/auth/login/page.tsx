import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { safeNext } from '@/lib/safe-redirect'
import { LoginForm } from './login-form'

type SearchParams = { code?: string; next?: string; redirectTo?: string; verified?: string }

/**
 * Email-confirmation links must exchange `code` via /auth/callback (PKCE).
 * If Supabase lands on /auth/login?code=…, forward to the callback route.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  if (sp.code) {
    const next = safeNext(sp.next) ?? safeNext(sp.redirectTo) ?? '/account/profile'
    const qs = new URLSearchParams({ code: sp.code, next })
    if (sp.verified === '1') qs.set('verified', '1')
    redirect(`/auth/callback?${qs.toString()}`)
  }

  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
