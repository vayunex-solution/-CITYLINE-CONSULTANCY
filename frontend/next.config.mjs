/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@cityline/shared'],
  // Note: 'output: export' can be activated if cPanel requires pure static HTML hosting.
  // Kept as standard Next.js build during development pending cPanel host inspection.
  // output: process.env.NEXT_EXPORT === 'true' ? 'export' : undefined,
  eslint: {
    // Avoid blocking build during CI if non-critical lint rules trigger
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Strictly fail builds on type errors
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
