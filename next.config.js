/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  // Allow the large inline data (RESEARCH object, PRODUCTS array)
  experimental: {
    largePageDataBytes: 512 * 1024,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.paypal.com https://vercel.live",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' https://res.cloudinary.com https://www.paypalobjects.com data: blob:",
              "connect-src 'self' https://*.supabase.co https://www.paypal.com https://api-m.paypal.com https://api-m.sandbox.paypal.com https://generativelanguage.googleapis.com https://api.anthropic.com https://vitals.vercel-insights.com",
              "frame-src https://www.paypal.com https://www.sandbox.paypal.com https://vercel.live",
            ].join('; '),
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
