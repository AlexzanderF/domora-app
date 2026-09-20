import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  ...(process.env.NEXT_STATIC_EXPORT === "1"
    ? { output: "export", distDir: "dist", trailingSlash: true }
    : {}),
};

export default nextConfig;
