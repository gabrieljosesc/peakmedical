import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { Product } from '@/types'
import { getProductCoas } from '@/lib/coa'
import { getDoseSiblings } from '@/lib/peptide-doses'
import ProductDetail from '@/components/products/ProductDetail'
import ProductCard from '@/components/products/ProductCard'
import { ProductReviews } from '@/components/products/ProductReviews'
import { JsonLd } from '@/components/seo/JsonLd'
import { SITE_NAME, SITE_URL, absoluteUrl, breadcrumbJsonLd, metaDescription } from '@/lib/site'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('products')
    .select('title, description, images:product_images(url, sort_order)')
    .eq('slug', slug)
    .single()
  if (!data) return {}
  const description = metaDescription(
    data.description,
    `${data.title} — available wholesale from Peak Medical Wholesale for licensed medical professionals.`
  )
  const image = (data.images ?? []).sort((a, b) => a.sort_order - b.sort_order)[0]?.url
  return {
    title: data.title, // root template appends "| Peak Medical Wholesale"
    description,
    alternates: { canonical: `/product/${slug}` },
    openGraph: {
      type: 'website',
      title: `${data.title} | ${SITE_NAME}`,
      description,
      url: `/product/${slug}`,
      ...(image ? { images: [{ url: image, alt: data.title }] } : {}),
    },
    twitter: { card: image ? 'summary_large_image' : 'summary' },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const supabase = createAdminClient()

  const { data: product } = await supabase
    .from('products')
    .select('*, category:categories(*), images:product_images(id,url,sort_order)')
    .order('sort_order', { referencedTable: 'product_images', ascending: true })
    .eq('slug', slug)
    .single()

  if (!product) notFound()

  // Peptides encode dose in the title; offer other strengths of the same peptide
  const doseOptions = product.category?.slug === 'peptides'
    ? await getDoseSiblings(supabase, product)
    : []

  const { data: related } = await supabase
    .from('products')
    .select('*, category:categories(*), images:product_images(id,url,sort_order)')
    .order('sort_order', { referencedTable: 'product_images', ascending: true })
    .eq('category_id', product.category_id)
    .eq('is_active', true)
    .neq('id', product.id)
    .limit(4)

  const images = ((product.images ?? []) as { url: string; sort_order: number }[])
    .slice().sort((a, b) => a.sort_order - b.sort_order).map(i => i.url)
  const price = Number(product.base_price)
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: metaDescription(product.description, product.title),
    ...(images.length ? { image: images } : {}),
    ...(product.sku ? { sku: product.sku } : {}),
    url: absoluteUrl(`/product/${slug}`),
    ...(product.category ? { category: product.category.name } : {}),
    ...(price > 0 || product.is_free ? {
      offers: {
        '@type': 'Offer',
        url: absoluteUrl(`/product/${slug}`),
        priceCurrency: 'USD',
        price: price.toFixed(2),
        availability: 'https://schema.org/InStock',
        itemCondition: 'https://schema.org/NewCondition',
        seller: { '@id': `${SITE_URL}/#organization` },
      },
    } : {}),
    ...(Number(product.review_count) > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: Number(product.rating).toFixed(1),
        reviewCount: Number(product.review_count),
      },
    } : {}),
  }
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    ...(product.category ? [{ name: product.category.name, path: `/shop/${product.category.slug}` }] : []),
    { name: product.title, path: `/product/${slug}` },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <JsonLd data={[productJsonLd, breadcrumbJsonLd(crumbs)]} />
      <ProductDetail
        product={{
          ...(product as Product),
          coas: getProductCoas(slug, product.coa_url),
        }}
        doseOptions={doseOptions}
      />

      <ProductReviews productId={product.id} slug={slug} />

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
