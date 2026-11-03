import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import { SITE_URL } from '@/lib/site'

export const revalidate = 3600 // regenerate at most hourly

const STATIC_PATHS: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '/', priority: 1, changeFrequency: 'daily' },
  { path: '/shop', priority: 0.9, changeFrequency: 'daily' },
  { path: '/peptides', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/about', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/faq', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/shipping', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/referral', priority: 0.4, changeFrequency: 'monthly' },
  { path: '/blog', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/legal/privacy', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/legal/terms', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/legal/returns', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/legal/shipping-cold-chain', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/legal/verification-policy', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/legal/research-use-only', priority: 0.2, changeFrequency: 'yearly' },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAdminClient()
  const [{ data: products }, { data: categories }, { data: posts }] = await Promise.all([
    supabase.from('products').select('slug, updated_at').eq('is_active', true),
    supabase.from('categories').select('slug, created_at'),
    supabase.from('blog_posts').select('slug, updated_at, published_at').eq('is_published', true),
  ])

  const now = new Date()
  const url = (p: string) => `${SITE_URL}${p === '/' ? '' : p}`

  return [
    ...STATIC_PATHS.map(s => ({ url: url(s.path), lastModified: now, changeFrequency: s.changeFrequency, priority: s.priority })),
    ...(categories ?? []).map(c => ({
      url: url(`/shop/${c.slug}`), lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8,
    })),
    ...(products ?? []).map(p => ({
      url: url(`/product/${p.slug}`), lastModified: p.updated_at ? new Date(p.updated_at) : now, changeFrequency: 'weekly' as const, priority: 0.7,
    })),
    ...(posts ?? []).map(b => ({
      url: url(`/blog/${b.slug}`), lastModified: new Date(b.updated_at ?? b.published_at ?? now), changeFrequency: 'monthly' as const, priority: 0.5,
    })),
  ]
}
