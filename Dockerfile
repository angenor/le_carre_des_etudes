# ---- Base ----
FROM node:22-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma/
COPY prisma.config.ts ./
RUN pnpm install --frozen-lockfile

# ---- Build ----
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate
RUN pnpm build

# ---- Production ----
FROM base AS production
WORKDIR /app

# Copier le build Nuxt
COPY --from=build /app/.output ./.output

# Prisma : schema, config, migrations pour "migrate deploy"
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./
COPY --from=build /app/package.json ./

# Prisma runtime : le CLI et les adapters necessaires
COPY --from=deps /app/node_modules ./node_modules

# Dossier pour la base de donnees SQLite et les uploads
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV DATABASE_URL="file:/app/data/production.db"
ENV NITRO_PORT=3000

EXPOSE 3000

# Appliquer les migrations puis demarrer le serveur
CMD ["sh", "-c", "npx prisma migrate deploy && node .output/server/index.mjs"]
