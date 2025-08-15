import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during builds to avoid Prisma generated file issues
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow builds to complete even with type errors
    ignoreBuildErrors: false,
  },
};

export default nextConfig;