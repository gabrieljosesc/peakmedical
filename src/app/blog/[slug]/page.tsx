import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import { blogImage } from '@/lib/blog-images'
import { JsonLd } from '@/components/seo/JsonLd'
import { SITE_NAME, SITE_URL, SITE_LOGO, absoluteUrl, breadcrumbJsonLd, metaDescription } from '@/lib/site'

export const dynamic = 'force-dynamic'

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = createAdminClient()
  const { data } = await supabase.from('blog_posts').select('title, excerpt, body, published_at, updated_at').eq('slug', slug).single()
  if (!data) return {}
  const description = metaDescription(data.excerpt || data.body)
  const cover = blogImage(slug)
  return {
    title: data.title,
    description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      type: 'article',
      title: `${data.title} | ${SITE_NAME}`,
      description,
      url: `/blog/${slug}`,
      publishedTime: data.published_at ?? undefined,
      modifiedTime: data.updated_at ?? undefined,
      ...(cover ? { images: [{ url: cover, alt: data.title }] } : {}),
    },
    twitter: { card: cover ? 'summary_large_image' : 'summary' },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const supabase = createAdminClient()
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!post) notFound()
  const cover = blogImage(post.slug)
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: metaDescription(post.excerpt || post.body),
    ...(cover ? { image: [absoluteUrl(cover)] } : {}),
    datePublished: post.published_at ?? post.created_at,
    dateModified: post.updated_at ?? post.published_at ?? post.created_at,
    author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    publisher: { '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: SITE_LOGO } },
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
  }

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      <JsonLd data={[articleJsonLd, breadcrumbJsonLd([
        { name: 'Home', path: '/' }, { name: 'Blog', path: '/blog' }, { name: post.title, path: `/blog/${post.slug}` },
      ])]} />
      <Link href="/blog" className="text-sm text-[#1a3a5c] hover:underline">← Back to Blog</Link>
      <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">{post.title}</h1>
      <p className="text-sm text-gray-500 mb-6">
        {post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
      </p>
      {cover && (
        <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-8">
          <Image src={cover} alt={post.title} fill className="object-cover" sizes="(max-width:768px) 100vw, 768px" priority />
        </div>
      )}
      <div className="prose prose-gray max-w-none whitespace-pre-wrap leading-relaxed text-gray-700">
        {post.body}
      </div>
    </article>
  )
}
