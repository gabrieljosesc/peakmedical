/** Canonical site identity — single source of truth for metadata, sitemap and structured data. */
export const SITE_URL = 'https://www.peakmedicalwholesale.com'
export const SITE_NAME = 'Peak Medical Wholesale'
export const SITE_DESCRIPTION =
  'International medical supplier specializing in aesthetic injectables, dermal fillers, botulinum toxins, orthopedic, and more. Serving licensed professionals since 2012.'
export const SITE_PHONE = '+1-888-222-0373'
export const SITE_EMAIL = 'info@peakmedicalwholesale.com'
export const SITE_LOGO = `${SITE_URL}/logo.svg`

export const absoluteUrl = (path: string) => new URL(path, SITE_URL).toString()

/** Trim a product/blog body down to a clean meta description (≤155 chars, word boundary). */
export function metaDescription(text: string | null | undefined, fallback = SITE_DESCRIPTION): string {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim()
  if (!clean) return fallback
  if (clean.length <= 155) return clean
  const cut = clean.slice(0, 155)
  return cut.slice(0, Math.max(cut.lastIndexOf(' '), 100)).trim() + '…'
}

export const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: SITE_LOGO,
  email: SITE_EMAIL,
  telephone: SITE_PHONE,
  foundingDate: '2012',
  contactPoint: [{
    '@type': 'ContactPoint',
    telephone: SITE_PHONE,
    email: SITE_EMAIL,
    contactType: 'sales',
    availableLanguage: 'English',
    hoursAvailable: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '18:00',
    },
  }],
}

export const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  publisher: { '@id': `${SITE_URL}/#organization` },
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  }
}
