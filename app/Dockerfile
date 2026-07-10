# Produktions-Image für Planbar (Next.js 16 + Prisma + SQLite).
# Läuft als EIN Container-Prozess: enthält App-Server UND den Scheduler
# (instrumentation.ts). Für SQLite/Scheduler auf GENAU EINER Instanz laufen
# lassen (kein horizontales Skalieren) — für den Start völlig ausreichend.

FROM node:22-slim AS base
# openssl wird von Prisma benötigt
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# 1) Abhängigkeiten (Cache-freundlich)
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# 2) Build
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# 3) Laufzeit
FROM base AS runtime
ENV NODE_ENV=production
# Persistente Pfade: per Volume überschreibbar (siehe DEPLOY.md)
ENV DATABASE_URL="file:/data/prod.db"
ENV UPLOADS_DIR="/data/uploads"
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json
# Uploads-Verzeichnis anlegen (falls kein Volume gemountet ist)
RUN mkdir -p /data/uploads
EXPOSE 3000
# migrate deploy läuft beim Start, dann next start (Port via PORT-Env)
CMD ["npm", "run", "start:prod"]
