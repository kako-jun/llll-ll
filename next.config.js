/** @type {import('next').NextConfig} */
const nextConfig = {
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
  // キャッシュ最適化
  async headers() {
    return [
      {
        source: "/icons/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/favicon.ico",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
