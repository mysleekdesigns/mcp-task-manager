import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable server actions with increased body size for file uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Turbopack configuration (Next.js 16 default bundler)
  turbopack: {},

  // Configure webpack for client-side compatibility (used for custom server)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Prevent bundling of server-only modules on client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }
    return config;
  },

  // Allow images from common providers
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
};

export default nextConfig;
