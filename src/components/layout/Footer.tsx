import Link from 'next/link'
import { Phone, Mail, Clock } from 'lucide-react'

const shopLinks = [
  { label: 'All Products', href: '/shop' },
  { label: 'Cosmetic', href: '/shop/cosmetic' },
  { label: 'Mesotherapy', href: '/shop/mesotherapy' },
  { label: 'Orthopedic', href: '/shop/orthopedic' },
  { label: 'Gynecology', href: '/shop/gynecology' },
  { label: 'Rheumatology', href: '/shop/rheumatology' },
]

const accountLinks = [
  { label: 'Login', href: '/auth/login' },
  { label: 'Register', href: '/auth/register' },
  { label: 'My Orders', href: '/account/orders' },
  { label: 'Wishlist', href: '/account/wishlist' },
  { label: 'Cart', href: '/cart' },
]

const infoLinks = [
  { label: 'About Us', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Shipping Policy', href: '/shipping' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Referral Program', href: '/referral' },
  { label: 'Blog', href: '/blog' },
]

export default function Footer() {
  return (
    <footer className="bg-[#1a3a5c] text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Brand */}
        <div>
          <h2 className="text-xl font-bold mb-1">Peak Medical</h2>
          <p className="text-sm text-blue-200 mb-4 tracking-widest uppercase">Wholesale</p>
          <p className="text-sm text-white/70 leading-relaxed">
            International medical supplier serving doctors, clinics, spas, and hospitals since 2012.
          </p>
          <div className="mt-4 space-y-2 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 flex-shrink-0" />
              <span>+1-888-222-0373</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 flex-shrink-0" />
              <a href="mailto:info@peakmedicalwholesale.com" className="hover:text-white transition-colors">
                info@peakmedicalwholesale.com
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>Mon – Fri / 9:00 AM – 6:00 PM EST</span>
            </div>
          </div>
        </div>

        {/* Shop */}
        <div>
          <h3 className="font-semibold text-sm uppercase tracking-widest mb-4 text-blue-200">Shop</h3>
          <ul className="space-y-2">
            {shopLinks.map(link => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-white/70 hover:text-white transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Account */}
        <div>
          <h3 className="font-semibold text-sm uppercase tracking-widest mb-4 text-blue-200">Account</h3>
          <ul className="space-y-2">
            {accountLinks.map(link => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-white/70 hover:text-white transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Info */}
        <div>
          <h3 className="font-semibold text-sm uppercase tracking-widest mb-4 text-blue-200">Information</h3>
          <ul className="space-y-2">
            {infoLinks.map(link => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-white/70 hover:text-white transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-white/50">
          <p>© {new Date().getFullYear()} Peak Medical Wholesale. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
