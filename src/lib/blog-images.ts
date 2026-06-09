// Cover images for blog posts (sourced from the original peakmedicalwholesale.com).
// Keyed by post slug. Falls back to null (placeholder) when not mapped.
const BLOG_IMAGES: Record<string, string> = {
  'eye-drop-color-chart': 'https://peakmedicalwholesale.com/wp-content/uploads/2022/04/blog-eye.jpg',
  'therapeutic-injections-to-relieve-joint-pain': 'https://peakmedicalwholesale.com/wp-content/uploads/2022/04/blog-ortho.jpg',
  'the-basics-of-dermal-fillers': 'https://peakmedicalwholesale.com/wp-content/uploads/2022/04/blog-filler.jpg',
  'botulinum-toxin-what-is-it-exactly': 'https://peakmedicalwholesale.com/wp-content/uploads/2022/04/blog-botox-1.jpg',
}

export function blogImage(slug: string): string | null {
  return BLOG_IMAGES[slug] ?? null
}
