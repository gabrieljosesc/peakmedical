'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { ShoppingCart, Heart, User, Search, Menu, Phone, ChevronDown, X } from 'lucide-react'
import { useState } from 'react'
import { useCart } from '@/hooks/useCart'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import SearchBar from '@/components/products/SearchBar'

interface Category {
  id: string
  slug: string
  name: string
  parent_id: string | null
}

interface Props {
  user: { id: string; email?: string } | null
  categories: Category[]
  isAdmin?: boolean
  displayName?: string | null
}

export default function Navbar({ user, categories, isAdmin, displayName }: Props) {
  const { count } = useCart()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const navLink = (href: string, label: string, active: boolean) => (
    <Link
      href={href}
      className={cn(
        'text-[15px] font-medium transition-colors',
        active ? 'text-[#1a3a5c]' : 'text-gray-600 hover:text-[#1a3a5c]'
      )}
    >
      {label}
    </Link>
  )

  return (
    <header className="w-full sticky top-0 z-50 bg-white border-b shadow-sm">
      {/* Top bar */}
      <div className="bg-[#1a3a5c] text-white text-sm py-1.5 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Phone className="w-3.5 h-3.5" />
          <span>+1-888-222-0373</span>
          <span className="text-white/60 ml-2 hidden sm:inline">Mon – Fri / 9:00 AM – 6:00 PM EST</span>
        </div>
        <div className="hidden md:flex items-center gap-4 text-xs">
          <Link href="/faq" className="hover:text-blue-300 transition-colors">FAQ</Link>
          <Link href="/shipping" className="hover:text-blue-300 transition-colors">Shipping</Link>
          <Link href="/referral" className="hover:text-blue-300 transition-colors">Rewards</Link>
        </div>
      </div>

      {/* Main nav row */}
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <Image src="/logo.svg" alt="Peak Medical Wholesale" width={200} height={61} priority unoptimized className="h-12 w-auto" />
        </Link>

        {/* Center nav (desktop) */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLink('/', 'Home', pathname === '/')}

          {/* Products dropdown */}
          <div className="group relative">
            <button className={cn(
              'flex items-center gap-1 text-[15px] font-medium transition-colors',
              pathname.startsWith('/shop') ? 'text-[#1a3a5c]' : 'text-gray-600 hover:text-[#1a3a5c]'
            )}>
              Products <ChevronDown className="w-4 h-4" />
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 top-full pt-3 hidden group-hover:block z-50">
              <div className="w-[520px] bg-white rounded-xl border shadow-xl p-4 grid grid-cols-2 gap-1">
                {categories.map(cat => (
                  <Link
                    key={cat.slug}
                    href={`/shop/${cat.slug}`}
                    className="rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#1a3a5c] transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))}
                <Link
                  href="/shop"
                  className="col-span-2 mt-1 rounded-lg px-3 py-2 text-sm font-semibold text-[#1a3a5c] bg-blue-50 hover:bg-blue-100 text-center transition-colors"
                >
                  View All Products →
                </Link>
              </div>
            </div>
          </div>

          {navLink('/about', 'About us', pathname === '/about')}
          {navLink('/blog', 'Blog', pathname.startsWith('/blog'))}
          {navLink('/contact', 'Contact us', pathname === '/contact')}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSearchOpen(v => !v)}
            className="inline-flex items-center justify-center size-9 rounded-lg hover:bg-muted transition-colors"
            aria-label="Search"
          >
            {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </button>

          <Link href="/account/wishlist" className="hidden sm:inline-flex items-center justify-center size-9 rounded-lg hover:bg-muted transition-colors">
            <Heart className="w-5 h-5" />
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger render={
              user ? (
                <button className="inline-flex items-center gap-2 rounded-lg px-2 h-9 hover:bg-muted transition-colors">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#1a3a5c] text-white text-xs font-semibold flex-shrink-0">
                    {(displayName ?? '?').slice(0, 1).toUpperCase()}
                  </span>
                  <span className="hidden sm:block max-w-[120px] truncate text-sm font-medium text-gray-700">{displayName}</span>
                </button>
              ) : (
                <button className="inline-flex items-center justify-center size-9 rounded-lg hover:bg-muted transition-colors">
                  <User className="w-5 h-5" />
                </button>
              )
            } />
            <DropdownMenuContent align="end">
              {user ? (
                <>
                  <DropdownMenuItem onClick={() => router.push('/account')}>My Account</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/account/orders')}>Orders</DropdownMenuItem>
                  {isAdmin && <DropdownMenuItem onClick={() => router.push('/admin')}>Admin Panel</DropdownMenuItem>}
                  <DropdownMenuItem onClick={() => router.push('/auth/logout')}>Sign Out</DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => router.push('/auth/login')}>Login</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/auth/register')}>Register</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/cart" className="relative inline-flex items-center justify-center size-9 rounded-lg hover:bg-muted transition-colors">
            <ShoppingCart className="w-5 h-5" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#e63946] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </Link>

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger className="lg:hidden inline-flex items-center justify-center size-9 rounded-lg hover:bg-muted transition-colors">
              <Menu className="w-5 h-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 overflow-y-auto">
              <nav className="mt-6 space-y-0.5">
                <Link href="/" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-[#1a3a5c]">Home</Link>
                <p className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Products</p>
                {categories.map(cat => (
                  <Link
                    key={cat.slug}
                    href={`/shop/${cat.slug}`}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'block px-3 py-2 text-sm rounded-md transition-colors',
                      pathname.startsWith(`/shop/${cat.slug}`) ? 'bg-[#1a3a5c] text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-[#1a3a5c]'
                    )}
                  >
                    {cat.name}
                  </Link>
                ))}
                <Link href="/shop" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-semibold text-[#1a3a5c] hover:bg-gray-100 rounded-md">All Products →</Link>
                <div className="pt-2 mt-2 border-t space-y-0.5">
                  <Link href="/about" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-[#1a3a5c]">About us</Link>
                  <Link href="/blog" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-[#1a3a5c]">Blog</Link>
                  <Link href="/contact" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-[#1a3a5c]">Contact us</Link>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Search drawer */}
      {searchOpen && (
        <div className="border-t bg-gray-50">
          <div className="max-w-3xl mx-auto px-4 py-3">
            <SearchBar />
          </div>
        </div>
      )}
    </header>
  )
}
