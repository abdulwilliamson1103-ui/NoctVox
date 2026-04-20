/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  distDir: '.next',
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/ignis-portal.html',
      },
    ]
  },
}

export default nextConfig
