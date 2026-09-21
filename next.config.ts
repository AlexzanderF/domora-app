import path from "node:path";
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
            "@/features/admin/server/actions":
              "./src/features/admin/server/actions.static.ts",
            "@/features/requests/server/actions":
              "./src/features/requests/server/actions.static.ts",
          },
        },
        webpack: (config) => {
          config.resolve = config.resolve || {};
          config.resolve.alias = config.resolve.alias || {};
          config.resolve.alias["@/features/auth/server/actions"] = path.resolve(
            process.cwd(),
            "src/features/auth/server/actions.static.ts",
          );
          config.resolve.alias["@/features/admin/server/actions"] =
            path.resolve(
              process.cwd(),
              "src/features/admin/server/actions.static.ts",
            );
          config.resolve.alias["@/features/requests/server/actions"] =
            path.resolve(
              process.cwd(),
              "src/features/requests/server/actions.static.ts",
            );
          return config;
        },
      }
    : {}),
};

export default nextConfig;
