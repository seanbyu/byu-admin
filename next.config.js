const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  transpilePackages: [
    '@salon-admin/api-core',
    '@byu-admin/supabase',
  ],
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'lodash', 'react-use'],
  },
};

module.exports = withNextIntl(nextConfig);
