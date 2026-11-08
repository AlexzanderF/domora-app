import type { NextConfig } from "next";

const rawBasePath = process.env.BASE_PATH?.trim();
const basePath =
  rawBasePath && rawBasePath !== "/"
    ? rawBasePath.startsWith("/")
      ? rawBasePath
      : `/${rawBasePath}`
    : undefined;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  basePath,
};

export default nextConfig;
