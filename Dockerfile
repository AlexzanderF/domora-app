FROM node:24-alpine AS base

# 1. Install all dependencies (dev included, needed for the build)
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2. Build the app and the self-contained migration bundle
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p /app/public
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build
# The migrate step runs plain JS so it needs no tsx/devDependencies at runtime.
RUN npx esbuild src/db/migrate.ts --bundle --platform=node --format=esm \
    --packages=external --outfile=dist-migrate/migrate.mjs
# Drop devDependencies so the runtime image only carries production packages.
RUN npm prune --omit=dev

# 3. Production runner, shared by web, migrate (and the future worker)
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/dist-migrate/migrate.mjs ./migrate.mjs

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
