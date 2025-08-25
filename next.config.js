/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    domains: ['firebasestorage.googleapis.com'],
    unoptimized: true,
  },
}

module.exports = nextConfig