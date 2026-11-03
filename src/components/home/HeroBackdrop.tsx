/**
 * Decorative hero backdrop rendered as an inline SVG (not a CSS background or
 * <img>), so it is never a Largest-Contentful-Paint candidate — the headline
 * text is. Purely visual; hidden from assistive tech.
 */
export default function HeroBackdrop() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1600 720"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="pmw-hero-base" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0f2438" />
          <stop offset="0.5" stopColor="#1a3a5c" />
          <stop offset="1" stopColor="#244f7c" />
        </linearGradient>
        <radialGradient id="pmw-hero-glow1" cx="78%" cy="22%" r="55%">
          <stop offset="0" stopColor="#3d7ab0" stopOpacity="0.55" />
          <stop offset="1" stopColor="#3d7ab0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="pmw-hero-glow2" cx="92%" cy="80%" r="45%">
          <stop offset="0" stopColor="#2dd4bf" stopOpacity="0.18" />
          <stop offset="1" stopColor="#2dd4bf" stopOpacity="0" />
        </radialGradient>
        <pattern id="pmw-hero-hex" width="56" height="64" patternUnits="userSpaceOnUse" patternTransform="scale(1.4)">
          <path d="M28 0 L56 16 L56 48 L28 64 L0 48 L0 16 Z" fill="none" stroke="#ffffff" strokeOpacity="0.05" strokeWidth="1" />
        </pattern>
      </defs>

      <rect width="1600" height="720" fill="url(#pmw-hero-base)" />
      <rect width="1600" height="720" fill="url(#pmw-hero-hex)" />
      <rect width="1600" height="720" fill="url(#pmw-hero-glow1)" />
      <rect width="1600" height="720" fill="url(#pmw-hero-glow2)" />

      {/* abstract flowing lines */}
      <g fill="none" stroke="#ffffff" strokeOpacity="0.08" strokeWidth="2">
        <path d="M-50 600 C 350 480, 700 700, 1100 520 S 1700 540, 1700 540" />
        <path d="M-50 660 C 400 560, 800 740, 1200 580 S 1700 600, 1700 600" />
      </g>

      {/* faint molecule dots */}
      <g fill="#ffffff" fillOpacity="0.06">
        <circle cx="1180" cy="160" r="6" />
        <circle cx="1320" cy="240" r="4" />
        <circle cx="1420" cy="120" r="5" />
        <circle cx="1260" cy="320" r="3" />
      </g>
      <g stroke="#9ec3e6" strokeOpacity="0.12" strokeWidth="2">
        <line x1="1180" y1="160" x2="1320" y2="240" />
        <line x1="1320" y1="240" x2="1420" y2="120" />
        <line x1="1320" y1="240" x2="1260" y2="320" />
      </g>
    </svg>
  )
}
