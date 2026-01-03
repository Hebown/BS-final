import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
    // 图片优化和缓存配置
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60, // 缓存 60 秒
  },
  // 增加请求体大小限制（用于文件上传）
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // 允许上传最大 50MB 的文件
    },
  },
  // 启用静态优化
  compress: true,
  // 修复 fs 和 zlib 错误：将 Node.js 模块标记为外部包，只在服务器端使用
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // 在客户端构建中，忽略 Node.js 模块
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        zlib: false,
        stream: false,
        crypto: false,
        path: false,
        os: false,
      };
    }
    return config;
  },
};

export default nextConfig;
