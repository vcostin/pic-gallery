import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    domains: ['localhost'],
    unoptimized: true
  },
  // Enable compression for better performance
  compress: true,
  // PoweredBy header removal for security
  poweredByHeader: false,
  // Turbopack configuration for optimized builds
  turbopack: {
    // Optimize module resolution for common aliases
    resolveAlias: {
      // Useful for consistent imports across the app
      '@': './src',
      '@/components': './src/components',
      '@/lib': './src/lib',
      '@/styles': './src/styles',
    },
    
    // Custom file extension resolution for better performance
    resolveExtensions: [
      '.ts',
      '.tsx', 
      '.js',
      '.jsx',
      '.json',
      '.css',
      '.scss',
      '.sass'
    ],
  },
};

export default nextConfig;
