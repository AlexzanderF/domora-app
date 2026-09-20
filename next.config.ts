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
  ...(process.env.NEXT_STATIC_EXPORT === "1"
    ? { output: "export", distDir: "dist", trailingSlash: true }
    : {}),
};

export default nextConfig;
