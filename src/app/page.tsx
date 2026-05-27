import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { Product } from '@/types'
import ProductCard from '@/components/products/ProductCard'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ShieldCheck, Truck, HeadphonesIcon, Award } from 'lucide-react'

const categories = [
  { name: 'Cosmetic', slug: 'cosmetic', description: 'Fillers, Botox, Threads & more', color: 'bg-pink-50 border-pink-100' },
  { name: 'Mesotherapy', slug: 'mesotherapy', description: 'Vitamin cocktails & skin boosters', color: 'bg-purple-50 border-purple-100' },
  { name: 'Orthopedic', slug: 'orthopedic', description: 'Joint & spine injectables', color: 'bg-blue-50 border-blue-100' },
  { name: 'Gynecology', slug: 'gynecology', description: 'Specialized gynecological products', color: 'bg-rose-50 border-rose-100' },
  { name: 'Ophthalmology', slug: 'ophthalmology', description: 'Eye care medications', color: 'bg-cyan-50 border-cyan-100' },
  { name: 'Rheumatology', slug: 'rheumatology', description: 'Arthritis & autoimmune treatments', color: 'bg-green-50 border-green-100' },
]

const trustFeatures = [
  { icon: ShieldCheck, title: 'Authentic Products', desc: 'All products are guaranteed legit and authentic from trusted manufacturers.' },
  { icon: Truck, title: 'Free Shipping', desc: 'Complimentary shipping on all orders over $250.' },
  { icon: HeadphonesIcon, title: '24/7 Support', desc: 'Our customer service team is ready to assist you anytime.' },
  { icon: Award, title: 'Since 2012', desc: 'Over a decade of trusted service to medical professionals worldwide.' },
]

export default async function HomePage() {
  const supabase = createAdminClient()
  const { data: featured } = await supabase
    .from('products')
    .select('*, category:categories(*), brand:brands(*)')
    .eq('featured', true)
    .limit(8)

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1a3a5c] to-[#2a5a8c] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-blue-300 text-sm font-medium tracking-widest uppercase mb-3">Trusted by Medical Professionals Since 2012</p>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
            Premium Medical Supplies<br />at Wholesale Prices
          </h1>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
            Dermal fillers, botulinum toxins, orthopedic, and more — sourced from trusted manufacturers and delivered to your clinic.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/shop" className={cn(buttonVariants({ size: 'lg' }), 'bg-white text-[#1a3a5c] hover:bg-gray-100 font-semibold')}>
              Browse All Products
            </Link>
            <Link href="/auth/register" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'border-white text-white hover:bg-white/10')}>
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* Trust features */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {trustFeatures.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 rounded-full bg-[#1a3a5c]/10 flex items-center justify-center">
                <Icon className="w-6 h-6 text-[#1a3a5c]" />
              </div>
              <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Shop by Category</h2>
          <Link href="/shop" className="text-sm text-[#1a3a5c] hover:underline font-medium">View all →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map(cat => (
            <Link key={cat.slug} href={`/shop/${cat.slug}`}
              className={`rounded-xl border p-4 text-center hover:shadow-md transition-shadow ${cat.color}`}>
              <h3 className="font-semibold text-gray-800 text-sm mb-1">{cat.name}</h3>
              <p className="text-xs text-gray-500">{cat.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      {featured && featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Featured Products</h2>
            <Link href="/shop" className="text-sm text-[#1a3a5c] hover:underline font-medium">View all →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(featured as Product[]).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* CTA banner */}
      <section className="bg-[#e63946] text-white py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-2">Ready to Order?</h2>
          <p className="text-white/90 mb-6">Create your free account and start ordering at wholesale prices today.</p>
          <Link href="/auth/register" className={cn(buttonVariants({ size: 'lg' }), 'bg-white text-[#e63946] hover:bg-gray-100 font-semibold')}>
            Get Started Free
          </Link>
        </div>
      </section>
    </div>
  )
}
