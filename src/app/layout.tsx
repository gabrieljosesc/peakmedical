import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { CartProvider } from '@/hooks/useCart'
import { Toaster } from '@/components/ui/sonner'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/server'

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${inter.className} min-h-full flex flex-col bg-gray-50`}>
        <CartProvider>
          <Navbar user={user} />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <Toaster position="top-right" richColors />
        </CartProvider>
      </body>
    </html>
  )
}
