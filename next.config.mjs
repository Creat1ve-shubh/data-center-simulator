/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Required for Docker standalone output
  output: 'standalone',
  experimental: {
    // Optimize bundle size
    optimizePackageImports: ['recharts', 'lucide-react', '@radix-ui/react-icons'],
  },
}

export default nextConfig