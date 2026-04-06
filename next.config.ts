import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * 纯静态导出（生成 `out/`），可部署到任意静态托管。
   * 注意：静态导出不支持运行时的 Image Optimization / Route Handlers 等能力。
   */
  output: "export",
  images: {
    // 静态导出模式下必须禁用 Next 的图片优化（否则需要服务端）。
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.shields.io",
        pathname: "/badge/**",
      },
      {
        protocol: "https",
        hostname: "pub-98482c38eca64dbe97c319bbed26cad3.r2.dev",
        pathname: "/gallery/**",
      },
    ],
  },
};

export default nextConfig;
