import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.basketball-reference.com",
      },
    ],
  },
};

export default nextConfig;
