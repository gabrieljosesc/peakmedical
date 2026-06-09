import Link from 'next/link'
import Image from 'next/image'
import { createAdminClient } from '@/lib/supabase/server'
import { Product } from '@/types'
import ProductCard from '@/components/products/ProductCard'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { blogImage } from '@/lib/blog-images'
import {
  ShieldCheck, Truck, HeadphonesIcon, Award, Gift, Wallet,
  Star, ArrowRight, CheckCircle2,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const CAT_COLORS = [
  'from-pink-50 to-pink-100/40', 'from-purple-50 to-purple-100/40',
  'from-blue-50 to-blue-100/40', 'from-cyan-50 to-cyan-100/40',
  'from-green-50 to-green-100/40', 'from-orange-50 to-orange-100/40',
  'from-rose-50 to-rose-100/40', 'from-yellow-50 to-yellow-100/40',
  'from-teal-50 to-teal-100/40', 'from-indigo-50 to-indigo-100/40',
  'from-red-50 to-red-100/40', 'from-emerald-50 to-emerald-100/40',
]

const trustFeatures = [
  { icon: ShieldCheck, title: 'Authentic Products', desc: 'Sourced only from trusted, original manufacturers.' },
  { icon: Truck, title: 'Free Shipping $250+', desc: 'Complimentary shipping on all qualifying orders.' },
  { icon: HeadphonesIcon, title: 'Friendly Support', desc: 'Reach us anytime by toll-free phone and email.' },
  { icon: Award, title: 'Trusted Since 2012', desc: 'A decade serving medical professionals worldwide.' },
]

const reviews = [
  { name: 'Dr. Sarah M.', role: 'Aesthetic Clinic, CA', text: 'Peak Medical has been our go-to supplier for years. Authentic products, fast shipping, and the prices are unbeatable.', stars: 5 },
  { name: 'Dr. James R.', role: 'Rheumatology, MO', text: 'Ordering is simple and the team always confirms everything personally. Viscosupplements always arrive in perfect cold-chain condition.', stars: 5 },
  { name: 'Lauren T.', role: 'Med Spa Owner, TX', text: 'Great selection of fillers and toxins at wholesale prices. Customer service is genuinely helpful and responsive.', stars: 5 },
]

export default async function HomePage() {
  const supabase = createAdminClient()

  const [{ data: categories }, { data: featured }, { data: posts }] = await Promise.all([
    supabase.from('categories').select('id, slug, name').is('parent_id', null).order('sort_order').limit(12),
    supabase.from('products')
      .select('*, category:categories(*), images:product_images(id,url,sort_order)')
      .eq('is_featured', true).eq('is_active', true).limit(10),
    supabase.from('blog_posts')
      .select('slug, title, excerpt, published_at')
      .eq('is_published', true).order('published_at', { ascending: false }).limit(3),
  ])

  return (
    <div>
      {/* ── HERO (background image) ──────────────────────────────────── */}
      <section
        className="relative overflow-hidden bg-[#1a3a5c] bg-cover bg-center"
        style={{ backgroundImage: 'url(/hero-bg.svg)' }}
      >
        {/* left-to-right dark overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f2438]/90 via-[#13314d]/70 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 py-20 lg:py-28">
          <div className="max-w-2xl text-white">
            <p className="inline-flex items-center gap-2 text-blue-200 text-xs font-semibold tracking-widest uppercase mb-4 bg-white/10 rounded-full px-3 py-1">
              <Award className="w-3.5 h-3.5" /> Trusted by Medical Professionals Since 2012
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.05] mb-5">
              Premium Medical Supplies at Wholesale Prices
            </h1>
            <p className="text-white/85 text-lg mb-8 max-w-xl">
              We specialize in the wholesale of botulinum toxins, dermal fillers, orthopedic
              injectables, rheumatology, and research peptides — delivered straight to your clinic.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/shop" className={cn(buttonVariants({ size: 'lg' }), 'bg-white text-[#1a3a5c] hover:bg-gray-100 font-semibold gap-2')}>
                Shop All Products <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/auth/register" className={cn(buttonVariants({ size: 'lg' }), 'bg-transparent border border-white text-white hover:bg-white hover:text-[#1a3a5c] font-semibold')}>
                Create Account
              </Link>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-8 text-sm text-white/75">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-blue-300" /> Authentic &amp; guaranteed</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-blue-300" /> Cold-chain shipping</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-blue-300" /> Licensed pros only</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ────────────────────────────────────────────────── */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {trustFeatures.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1a3a5c]/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-[#1a3a5c]" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CATEGORIES ───────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Shop by Category</h2>
          <p className="text-gray-500 mt-2">Everything you need to run your practice, in one place.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {(categories ?? []).map((cat, i) => (
            <Link key={cat.slug} href={`/shop/${cat.slug}`}
              className={`group rounded-2xl border border-gray-100 bg-gradient-to-br ${CAT_COLORS[i % CAT_COLORS.length]} p-5 text-center hover:shadow-lg hover:-translate-y-0.5 transition-all`}>
              <h3 className="font-semibold text-gray-800 text-sm leading-snug group-hover:text-[#1a3a5c]">{cat.name}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* ── BEST SELLERS ─────────────────────────────────────────────── */}
      {featured && featured.length > 0 && (
        <section className="bg-gray-50 border-y">
          <div className="max-w-7xl mx-auto px-4 py-14">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Our Best Sellers</h2>
                <p className="text-gray-500 mt-2">Discover Peak Medical Wholesale&apos;s best-selling products.</p>
              </div>
              <Link href="/shop" className="text-sm text-[#1a3a5c] hover:underline font-medium whitespace-nowrap">View all →</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {(featured as Product[]).map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CASH BACK & REFERRAL ─────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a3a5c] to-[#2a5a8c] text-white p-8 lg:p-10">
            <Wallet className="w-10 h-10 text-blue-200 mb-4" />
            <h3 className="text-2xl font-bold mb-2">Get Cash Back on Every Order</h3>
            <p className="text-white/80 mb-6 max-w-md">
              Earn rewards on your purchases and redeem them toward future orders. The more you order, the more you save.
            </p>
            <Link href="/referral" className={cn(buttonVariants(), 'bg-white text-[#1a3a5c] hover:bg-gray-100 font-semibold')}>
              Start Earning
            </Link>
          </div>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#e63946] to-[#c92d3a] text-white p-8 lg:p-10">
            <Gift className="w-10 h-10 text-white/80 mb-4" />
            <h3 className="text-2xl font-bold mb-2">Refer a Colleague, Get Rewarded</h3>
            <p className="text-white/90 mb-6 max-w-md">
              Invite fellow medical professionals to Peak Medical Wholesale and you both receive a reward on your next purchase.
            </p>
            <Link href="/referral" className={cn(buttonVariants(), 'bg-white text-[#e63946] hover:bg-gray-100 font-semibold')}>
              Know More About Our Referral Program
            </Link>
          </div>
        </div>
      </section>

      {/* ── BLOG ─────────────────────────────────────────────────────── */}
      {posts && posts.length > 0 && (
        <section className="bg-gray-50 border-y">
          <div className="max-w-7xl mx-auto px-4 py-14">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">From Our Blog</h2>
                <p className="text-gray-500 mt-2">Updates on medical news and discoveries.</p>
              </div>
              <Link href="/blog" className="text-sm text-[#1a3a5c] hover:underline font-medium whitespace-nowrap">All posts →</Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {posts.map(post => {
                const cover = blogImage(post.slug)
                return (
                <Link key={post.slug} href={`/blog/${post.slug}`}
                  className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative aspect-[16/9] bg-gradient-to-br from-[#1a3a5c]/10 to-[#2a5a8c]/5 flex items-center justify-center overflow-hidden">
                    {cover ? (
                      <Image src={cover} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width:768px) 100vw, 33vw" />
                    ) : (
                      <Award className="w-10 h-10 text-[#1a3a5c]/30" />
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-gray-400 mb-2">
                      {post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                    </p>
                    <h3 className="font-semibold text-gray-800 group-hover:text-[#1a3a5c] leading-snug mb-2">{post.title}</h3>
                    {post.excerpt && <p className="text-sm text-gray-500 line-clamp-2">{post.excerpt}</p>}
                  </div>
                </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── CUSTOMER REVIEWS ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">What Our Customers Say</h2>
          <p className="text-gray-500 mt-2">Trusted by clinics, spas, and hospitals across the country.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {reviews.map(r => (
            <div key={r.name} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: r.stars }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">&ldquo;{r.text}&rdquo;</p>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{r.name}</p>
                <p className="text-xs text-gray-500">{r.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────────── */}
      <section className="bg-[#1a3a5c] text-white">
        <div className="max-w-4xl mx-auto px-4 py-14 text-center">
          <h2 className="text-3xl font-bold mb-3">Ready to Order at Wholesale Prices?</h2>
          <p className="text-white/80 mb-7 max-w-2xl mx-auto">
            We help doctors and busy medical professionals save time and money. Create your free
            account and start ordering from trusted manufacturers today.
          </p>
          <Link href="/auth/register" className={cn(buttonVariants({ size: 'lg' }), 'bg-white text-[#1a3a5c] hover:bg-gray-100 font-semibold')}>
            Get Started Free
          </Link>
        </div>
      </section>
    </div>
  )
}
