/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: [],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 31536000, // 1年間キャッシュ
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  allowedDevOrigins: ["192.168.0.49"],
  // パフォーマンス最適化
  compress: true,
  poweredByHeader: false,
  experimental: {
    // optimizeCss: true, // 一時的に無効化
    optimizePackageImports: ["react", "react-dom"],
  },
  // 静的最適化
  trailingSlash: false,
};

module.exports = nextConfig;
