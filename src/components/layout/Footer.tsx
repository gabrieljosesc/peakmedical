import Link from 'next/link'
import Image from 'next/image'
import { Phone, Mail, Clock } from 'lucide-react'

const shopLinks = [
  { label: 'All Products', href: '/shop' },
  { label: 'Dermal Fillers', href: '/shop/dermal-fillers' },
  { label: 'Botulinum Toxins', href: '/shop/botulinum-toxins' },
  { label: 'Mesotherapy', href: '/shop/mesotherapy' },
  { label: 'Orthopedic Injections', href: '/shop/orthopedic-injections' },
  { label: 'Peptides', href: '/shop/peptides' },
]

const accountLinks = [
  { label: 'Login', href: '/auth/login' },
  { label: 'Register', href: '/auth/register' },
  { label: 'My Orders', href: '/account/orders' },
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
      {/* About strip */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="bg-white rounded-2xl px-6 py-4 inline-block mb-5">
            <Image src="/logo.svg" alt="Peak Medical Wholesale" width={220} height={67} unoptimized className="h-14 w-auto" />
          </div>
          <p className="text-sm text-white/70 leading-relaxed max-w-3xl">
            We help doctors and other busy medical professionals save time and money. We source
            medical supplies from all the most trusted manufacturers for your convenience — botulinum
            toxins, dermal fillers, orthopedic injectables, rheumatology, and research peptides. To
            find out just how easy it is to get everything you need to run your practice, reach out today.
          </p>
        </div>
      </div>

      {/* Link columns */}
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <h3 className="font-semibold text-sm uppercase tracking-widest mb-4 text-blue-200">Contact</h3>
          <div className="space-y-2 text-sm text-white/80">
            <div className="flex items-center gap-2"><Phone className="w-4 h-4 flex-shrink-0" /><span>+1-888-222-0373</span></div>
            <div className="flex items-center gap-2"><Mail className="w-4 h-4 flex-shrink-0" /><a href="mailto:info@peakmedicalwholesale.com" className="hover:text-white transition-colors break-all">info@peakmedicalwholesale.com</a></div>
            <div className="flex items-start gap-2"><Clock className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>Mon – Fri / 9:00 AM – 6:00 PM EST</span></div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-sm uppercase tracking-widest mb-4 text-blue-200">Shop</h3>
          <ul className="space-y-2">
            {shopLinks.map(link => (
              <li key={link.href}><Link href={link.href} className="text-sm text-white/70 hover:text-white transition-colors">{link.label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-sm uppercase tracking-widest mb-4 text-blue-200">Account</h3>
          <ul className="space-y-2">
            {accountLinks.map(link => (
              <li key={link.href}><Link href={link.href} className="text-sm text-white/70 hover:text-white transition-colors">{link.label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-sm uppercase tracking-widest mb-4 text-blue-200">Information</h3>
          <ul className="space-y-2">
            {infoLinks.map(link => (
              <li key={link.href}><Link href={link.href} className="text-sm text-white/70 hover:text-white transition-colors">{link.label}</Link></li>
            ))}
          </ul>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <p className="text-[11px] leading-relaxed text-white/40">
            Information on Peak Medical Wholesale is provided for informational purposes only and may
            not cover all precautions, side effects, and other information about any given product. All
            brand names and product images belong to their respective owners; Peak Medical Wholesale is
            in no way affiliated with the manufacturers of these products. Only qualified and
            suitably-trained medical practitioners should purchase and use medical products.
          </p>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-white/50">
          <p>© {new Date().getFullYear()} Peak Medical Wholesale. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/legal/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
