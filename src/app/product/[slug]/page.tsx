import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { Product } from '@/types'
import ProductDetail from '@/components/products/ProductDetail'
import ProductCard from '@/components/products/ProductCard'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('products')
    .select('name, short_description')
    .eq('slug', slug)
    .single()
  if (!data) return {}
  return { title: data.name, description: data.short_description ?? undefined }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const supabase = createAdminClient()

  const { data: product } = await supabase
    .from('products')
    .select('*, category:categories(*), brand:brands(*)')
    .eq('slug', slug)
    .single()

  if (!product) notFound()

  const { data: related } = await supabase
    .from('products')
    .select('*, category:categories(*), brand:brands(*)')
    .eq('category_id', product.category_id)
    .neq('id', product.id)
    .limit(4)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <ProductDetail product={product as Product} />

      {related && related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Related Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(related as Product[]).map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
