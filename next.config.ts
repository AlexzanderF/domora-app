import type { NextConfig } from "next";

const rawBasePath = process.env.BASE_PATH?.trim();
const basePath =
  rawBasePath && rawBasePath !== "/"
    ? rawBasePath.startsWith("/")
      ? rawBasePath
      : `/${rawBasePath}`
    : undefined;

const isStatic = process.env.NEXT_STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  basePath,
  ...(isStatic
    ? {
        output: "export",
        distDir: "dist",
        trailingSlash: true,
        turbopack: {
          resolveAlias: {
            "@/features/auth/server/actions":
              "./src/features/auth/server/actions.static.ts",
          },
        },
      }
    : {}),
};

export default nextConfig;
