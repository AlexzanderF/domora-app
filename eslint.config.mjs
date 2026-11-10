import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Feature boundaries (ADR 0007): features must not import other features,
// except through this allowlist. Shape: importer feature -> imported feature
// -> why the dependency is allowed. Adding an entry needs a reason.
const featureAllowlist = {
  admin: {
    auth: "Reads the session/actor to authorise admin actions and uses useAuth for the signed-in admin.",
    requests:
      "Admin queues drive the request lifecycle (transition/assign actions) and reuse priority rules and report photos.",
    services:
      "Renders service categories and request stages from the shared service catalog.",
  },
  auth: {
    admin:
      "auth-provider calls the specialist-status server action owned by admin.",
  },
  bookings: {
    plans: "Booking dialog reuses the date and time pickers owned by plans.",
    requests:
      "Booking dialog creates the service request via the requests server action.",
    services: "Uses the service catalog for categories.",
  },
  "client-dashboard": {
    bookings: "Opens the booking dialog through the booking provider.",
    requests: "Transitions request stages via the requests server action.",
    services: "Uses the service catalog and ServiceIcon.",
  },
  "client-profile": {
    auth: "Reuses auth validation, user queries and session; the profile form reads useAuth.",
  },
  landing: {
    bookings: "Showcase cards render the booking call-to-action.",
    services: "Showcase renders the landing service catalog and ServiceIcon.",
  },
  plans: {
    subscriptions: "Configurator starts a subscription via its server action.",
  },
  requests: {
    auth: "Request server actions resolve the acting user.",
    services:
      "Request list renders ServiceIcon and request stages from the catalog.",
  },
  services: {
    bookings:
      "Service grid opens the booking dialog through the booking provider.",
  },
  specialist: {
    bookings: "Daily agenda reuses the photo picker and report photo upload.",
    requests:
      "Specialist assigns/transitions requests and reuses request rules.",
    services: "Uses the service catalog and ServiceIcon.",
  },
  subscriptions: {
    auth: "Subscription server actions resolve the acting user.",
  },
};

const features = [
  "admin",
  "auth",
  "bookings",
  "client-dashboard",
  "client-profile",
  "landing",
  "plans",
  "requests",
  "services",
  "specialist",
  "subscriptions",
];

const featureBoundaryConfigs = features.map((feature) => {
  const allowed = Object.keys(featureAllowlist[feature] ?? {});
  const others = features.filter((f) => f !== feature);
  const exceptions = [feature, ...allowed].flatMap((f) => [
    `!@/features/${f}`,
    `!@/features/${f}/**`,
  ]);
  return {
    files: [`src/features/${feature}/**/*.{ts,tsx}`],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/**", ...exceptions],
              message:
                "Features may not import other features. Add a commented entry to featureAllowlist in eslint.config.mjs (ADR 0007).",
            },
            {
              group: others
                .filter((f) => !allowed.includes(f))
                .flatMap((f) => [`../${f}`, `../${f}/**`, `../../${f}/**`]),
              message:
                "Do not reach into another feature with relative imports (ADR 0007).",
            },
          ],
        },
      ],
    },
  };
});

// Dependency direction (ADR 0006/0007): app routes -> features -> components ->
// domain / lib. The bottom layers must never import upward.
const lowerLayerBoundary = {
  files: ["src/domain/**/*.{ts,tsx}", "src/lib/**/*.{ts,tsx}"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: [
              "@/features",
              "@/features/**",
              "@/app",
              "@/app/**",
              "@/components",
              "@/components/**",
            ],
            message:
              "src/domain and src/lib are lower layers: they must not import features, app routes or components (ADR 0006/0007).",
          },
        ],
      },
    ],
  },
};

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  ...featureBoundaryConfigs,
  lowerLayerBoundary,
  globalIgnores([
    ".next/**",
    ".claude/**",
    "out/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
  ]),
]);
