import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  env: { RELEASE_SHA: process.env.RELEASE_SHA || 'development' },
  generateBuildId: async () => process.env.RELEASE_SHA || 'development',
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=15552000; includeSubDomains',
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
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self'; upgrade-insecure-requests",
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(self), payment=(), usb=()',
          },
        ],
      },
      {
        source: '/api/internal/files/:id/content',
        headers: [
          { key: 'Content-Security-Policy', value: "sandbox; default-src 'none'; frame-ancestors 'self'" },
          { key: 'Cache-Control', value: 'private, no-store, max-age=0' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
