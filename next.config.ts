import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'medicaplanet.com',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'iebpxtbrcsbgadwyrqqi.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
