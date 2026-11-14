import type { NextConfig } from 'next';
import path from 'path';

const apiBase = process.env.INTERNAL_API_URL || 'http://localhost:8080';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  outputFileTracingRoot: path.resolve(__dirname),
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiBase}/api/:path*`,
      },
      {
        source: '/media/:path*',
        destination: `${apiBase}/media/:path*`,
      },
    ];
  },
};

export default nextConfig;
