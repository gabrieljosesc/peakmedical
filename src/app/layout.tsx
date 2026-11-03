import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Inter } from 'next/font/google'
import './globals.css'
import { CartProvider } from '@/hooks/useCart'
import { WishlistProvider } from '@/hooks/useWishlist'
import { Toaster } from '@/components/ui/sonner'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import NavigationProgress from '@/components/layout/NavigationProgress'
import { FloatingCart } from '@/components/FloatingCart'
import { createAdminClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/auth'
import { GoogleAnalytics } from '@next/third-parties/google'
import { JsonLd } from '@/components/seo/JsonLd'
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, organizationJsonLd, websiteJsonLd } from '@/lib/site'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Peak Medical Wholesale — Medical Supplies for Professionals',
    template: '%s | Peak Medical Wholesale',
  },
  description: SITE_DESCRIPTION,
  keywords: ['medical wholesale', 'dermal fillers', 'botox', 'medical supplies', 'aesthetic products'],
  applicationName: SITE_NAME,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [{ url: '/logo.svg', alt: SITE_NAME }],
  },
  twitter: { card: 'summary' },
  robots: { index: true, follow: true },
  // Search Console "HTML tag" verification — set GOOGLE_SITE_VERIFICATION in Vercel env.
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
}

export const dynamic = 'force-dynamic'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthUser()

  const admin = createAdminClient()
  const [{ data: categories }, { data: navSamples }] = await Promise.all([
    admin
      .from('categories')
      .select('id, slug, name, parent_id')
      .is('parent_id', null)
      .order('sort_order'),
    admin
      .from('products')
      .select('slug, title, base_price, images:product_images(url, sort_order)')
      .order('sort_order', { referencedTable: 'product_images', ascending: true })
      .eq('is_featured', true)
      .eq('is_active', true)
      .limit(3),
  ])

  // Flatten the hero image for each nav sample product
  const samples = (navSamples ?? []).map(p => ({
    slug: p.slug,
    title: p.title,
    base_price: Number(p.base_price),
    image: (p.images ?? []).sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)[0]?.url ?? null,
  }))

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
        <JsonLd data={[organizationJsonLd, websiteJsonLd]} />
        {process.env.NEXT_PUBLIC_GA_ID && <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />}
        <CartProvider>
          <WishlistProvider>
            <Suspense fallback={null}>
              <NavigationProgress />
            </Suspense>
            <Navbar user={user} categories={categories ?? []} navSamples={samples} isAdmin={isAdmin} displayName={displayName} />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
            <FloatingCart />
            <Toaster position="top-right" richColors />
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  )
}
