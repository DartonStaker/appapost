/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['apparely.co.za', 'res.cloudinary.com', 'cdn.shopify.com', 'skerjjeuapdbshgbhvrh.supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

module.exports = nextConfig

