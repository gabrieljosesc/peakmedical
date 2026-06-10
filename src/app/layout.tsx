import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { CartProvider } from '@/hooks/useCart'
import { WishlistProvider } from '@/hooks/useWishlist'
import { Toaster } from '@/components/ui/sonner'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { createAdminClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Peak Medical Wholesale — Medical Supplies for Professionals',
    template: '%s | Peak Medical Wholesale',
  },
  description:
    'International medical supplier specializing in aesthetic injectables, dermal fillers, botulinum toxins, orthopedic, and more. Serving licensed professionals since 2012.',
  keywords: ['medical wholesale', 'dermal fillers', 'botox', 'medical supplies', 'aesthetic products'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: 'Peak Medical Wholesale',
  },
}

export const dynamic = 'force-dynamic'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthUser()

  const admin = createAdminClient()
  const { data: categories } = await admin
    .from('categories')
    .select('id, slug, name, parent_id')
    .is('parent_id', null)
    .order('sort_order')

  // Fetch role + name for the navbar
  let isAdmin = false
  let displayName: string | null = null
  if (user) {
    const { data: profile } = await admin
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.role === 'admin'
    displayName = (profile?.full_name && profile.full_name.trim())
      || user.email?.split('@')[0]
      || null
  }

  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${inter.className} min-h-full flex flex-col bg-gray-50`}>
        <CartProvider>
          <WishlistProvider>
            <Navbar user={user} categories={categories ?? []} isAdmin={isAdmin} displayName={displayName} />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
            <Toaster position="top-right" richColors />
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  )
}
