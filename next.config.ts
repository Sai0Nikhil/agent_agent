import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    "/api/**": ["./skills/**/*", "./.adal/**/*", "./AGENTS.md"],
  },
};

export default nextConfig;
