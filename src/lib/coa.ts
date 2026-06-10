import coaManifest from '@/data/coa-manifest.json'

/** COA URL from DB column or upload manifest (when column not yet migrated). */
export function getProductCoaUrl(slug: string, coaUrl?: string | null): string | null {
  if (coaUrl) return coaUrl
  const url = (coaManifest as Record<string, string>)[slug]
  return url ?? null
}
