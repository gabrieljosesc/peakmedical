import type { Metadata } from 'next'

// The contact page itself is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Reach Peak Medical Wholesale by phone at +1-888-222-0373 or email info@peakmedicalwholesale.com — Mon–Fri, 9:00 AM–6:00 PM EST. Questions about products, orders or shipping welcome.',
  alternates: { canonical: '/contact' },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
