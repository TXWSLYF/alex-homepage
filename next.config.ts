import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
