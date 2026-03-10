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
}

module.exports = nextConfig
