/** @type {import('next').NextConfig} */
const isExport = process.env.NEXT_EXPORT === 'true';

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@cityline/shared'],
  eslint: {
    // Avoid blocking build during CI if non-critical lint rules trigger
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Strictly fail builds on type errors
    ignoreBuildErrors: false,
  },
  ...(isExport
    ? {
        output: 'export',
        trailingSlash: true,
        images: {
          unoptimized: true,
        },
      }
    : {
        async headers() {
          return [
            {
              source: '/(.*)',
              headers: [
                {
                  key: 'X-Frame-Options',
                  value: 'DENY',
                },
                {
                  key: 'X-Content-Type-Options',
                  value: 'nosniff',
                },
                {
                  key: 'Referrer-Policy',
                  value: 'strict-origin-when-cross-origin',
                },
                {
                  key: 'Permissions-Policy',
                  value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
                },
              ],
            },
          ];
        },
        async rewrites() {
          const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:5000';
          return [
            {
              source: '/api/v1/:path*',
              destination: `${backendUrl}/api/v1/:path*`,
            },
          ];
        },
      }),
};

export default nextConfig;
