'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ShoppingCart, Heart, User, Search, Menu, Phone } from 'lucide-react'
import { useState } from 'react'
import { useCart } from '@/hooks/useCart'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import SearchBar from '@/components/products/SearchBar'

const categories = [
  {
    name: 'Cosmetic',
    slug: 'cosmetic',
    sub: ['Fillers', 'Botulinum Toxins', 'Body Sculpting', 'Eyelash Enhancers', 'Filler Removal', 'Peels & Masks', 'Professional Skin Care', 'Threads'],
  },
  { name: 'Mesotherapy', slug: 'mesotherapy', sub: [] },
  { name: 'Orthopedic', slug: 'orthopedic', sub: [] },
  { name: 'Gynecology', slug: 'gynecology', sub: [] },
  { name: 'Ophthalmology', slug: 'ophthalmology', sub: [] },
  { name: 'Rheumatology', slug: 'rheumatology', sub: [] },
  {
    name: 'Other',
    slug: 'other',
    sub: ['Anaesthetics', 'Arthritis', 'Inflammatory Bowel Disease', 'Lupus', 'Multiple Sclerosis', 'Osteoporosis', 'PRP Kits', 'Psoriasis'],
  },
]

export default function Navbar({ user }: { user: { id: string; email?: string } | null }) {
  const { count } = useCart()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <header className="w-full sticky top-0 z-50 bg-white border-b shadow-sm">
      {/* Top bar */}
      <div className="bg-[#1a3a5c] text-white text-sm py-1.5 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Phone className="w-3.5 h-3.5" />
          <span>+1-888-222-0373</span>
          <span className="text-white/60 ml-2">Mon – Fri / 9:00 AM – 6:00 PM EST</span>
        </div>
        <div className="hidden md:flex items-center gap-4 text-xs">
          <Link href="/faq" className="hover:text-blue-300 transition-colors">FAQ</Link>
          <Link href="/shipping" className="hover:text-blue-300 transition-colors">Shipping</Link>
          <Link href="/contact" className="hover:text-blue-300 transition-colors">Contact</Link>
        </div>
      </div>

      {/* Main nav */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <span className="text-2xl font-bold text-[#1a3a5c]">Peak Medical</span>
          <span className="block text-xs text-gray-500 -mt-1 tracking-widest uppercase">Wholesale</span>
        </Link>

        {/* Desktop search */}
        <div className="flex-1 max-w-xl hidden md:block">
          <SearchBar />
        </div>

        {/* Icon actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSearchOpen(v => !v)}
          >
            <Search className="w-5 h-5" />
          </Button>

          <Link
            href="/account/wishlist"
            className="inline-flex items-center justify-center size-8 rounded-lg hover:bg-muted transition-colors"
          >
            <Heart className="w-5 h-5" />
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger render={
              <button className="inline-flex items-center justify-center size-8 rounded-lg hover:bg-muted transition-colors">
                <User className="w-5 h-5" />
              </button>
            } />
            <DropdownMenuContent align="end">
              {user ? (
                <>
                  <DropdownMenuItem onClick={() => router.push('/account')}>
                    My Account
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/account/orders')}>
                    Orders
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/auth/logout')}>
                    Sign Out
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => router.push('/auth/login')}>
                    Login
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/auth/register')}>
                    Register
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link
            href="/cart"
            className="relative inline-flex items-center justify-center size-8 rounded-lg hover:bg-muted transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#e63946] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </Link>

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              className="md:hidden inline-flex items-center justify-center size-8 rounded-lg hover:bg-muted transition-colors"
            >
              <Menu className="w-5 h-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 overflow-y-auto">
              <nav className="mt-6 space-y-1">
                {categories.map(cat => (
                  <div key={cat.slug}>
                    <Link
                      href={`/shop/${cat.slug}`}
                      className="block px-3 py-2 font-medium text-[#1a3a5c] hover:bg-gray-100 rounded-md"
                      onClick={() => setMobileOpen(false)}
                    >
                      {cat.name}
                    </Link>
                    {cat.sub.map(sub => (
                      <Link
                        key={sub}
                        href={`/shop/${cat.slug}/${sub.toLowerCase().replace(/\s+/g, '-')}`}
                        className="block pl-6 py-1.5 text-sm text-gray-600 hover:text-[#1a3a5c]"
                        onClick={() => setMobileOpen(false)}
                      >
                        {sub}
                      </Link>
                    ))}
                  </div>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Mobile search bar */}
      {searchOpen && (
        <div className="md:hidden px-4 pb-3">
          <SearchBar />
        </div>
      )}

      {/* Category nav (desktop) */}
      <nav className="hidden md:block border-t bg-[#1a3a5c]">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex items-center">
            {categories.map(cat => (
              <li key={cat.slug} className="group relative">
                <Link
                  href={`/shop/${cat.slug}`}
                  className={cn(
                    'block px-4 py-2.5 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 transition-colors',
                    pathname.startsWith(`/shop/${cat.slug}`) && 'bg-white/10 text-white'
                  )}
                >
                  {cat.name}
                </Link>
                {cat.sub.length > 0 && (
                  <div className="absolute left-0 top-full w-52 bg-white shadow-lg rounded-b-md border hidden group-hover:block z-50">
                    {cat.sub.map(sub => (
                      <Link
                        key={sub}
                        href={`/shop/${cat.slug}/${sub.toLowerCase().replace(/\s+/g, '-')}`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#1a3a5c]"
                      >
                        {sub}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            ))}
            <li className="ml-auto">
              <Link
                href="/shop"
                className="block px-4 py-2.5 text-sm font-medium text-white/90 hover:text-white"
              >
                All Products
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  )
}
