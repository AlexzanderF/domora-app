import { execFileSync } from "node:child_process";

// Keep the existing static host compatible while normal builds support a Next server.
execFileSync(process.execPath, ["node_modules/next/dist/bin/next", "build"], {
  stdio: "inherit",
  env: { ...process.env, NEXT_STATIC_EXPORT: "1" },
});
