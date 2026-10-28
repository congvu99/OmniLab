# Stage 1: build site tĩnh (verify-fidelity + astro build) → /app/dist
FROM node:24-slim AS build
ENV CI=true
RUN npm install -g pnpm@9.15.4
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ARG SITE_URL
RUN test -n "$SITE_URL" || { echo "SITE_URL build arg is required (sitemap.xml domain)"; exit 1; }
ENV SITE_URL=$SITE_URL
RUN pnpm build

# Stage 2: sync sidecar (progress sync API). Zero npm deps: node:http + node:sqlite,
# Node strips the TypeScript types itself (>= 24.2). Copy exactly what the entry
# imports at runtime (server/sync + three shared src/lib modules), keeping relative
# paths. Build it alone with `--target sync` (no SITE_URL needed).
# ORDER MATTERS: `app` must stay the LAST stage. A bare `docker build .` (no --target),
# e.g. a host that builds the root Dockerfile such as Railpack/Vibe Deploy, builds the
# last stage and must get the static site, not the sidecar. Compose uses explicit targets.
FROM node:24.15-alpine AS sync
ENV NODE_ENV=production
WORKDIR /app
COPY package.json ./
COPY server/sync ./server/sync
COPY src/lib/progress-state.ts src/lib/progress-merge.ts src/lib/progress-sync-types.ts ./src/lib/
# /data is the only writable path (bind mount in compose); uid 1000 = node.
RUN mkdir -p /data && chown node:node /data
USER node
EXPOSE 3000
CMD ["node", "server/sync/sync-server-entry.ts"]

# Stage 3: TTS worker (lesson audio). Same zero-deps Node pin as sync; ffmpeg is
# installed in this image only. Copies exactly what the entry imports at runtime
# plus the speech scripts produced by the site build, so `--target tts` pulls the
# `build` stage and needs the SITE_URL build arg too. No port, no HTTP
# HEALTHCHECK: the worker serves nothing; its state is in the logs and the manifest.
# The Gemini key is runtime env only (compose), never a build arg.
FROM node:24.15-alpine AS tts
RUN apk add --no-cache ffmpeg
ENV NODE_ENV=production
WORKDIR /app
COPY package.json ./
COPY server/tts ./server/tts
COPY src/lib/speech-script-contract.ts src/lib/audio-manifest.ts src/lib/progress-state.ts ./src/lib/
COPY --from=build /app/dist/tts-scripts.json ./tts-scripts.json
# /data/audio is the only writable path (bind mount in compose); uid 1000 = node.
RUN mkdir -p /data/audio && chown node:node /data/audio
USER node
CMD ["node", "server/tts/tts-worker-entry.ts"]

# Stage 4 (last, default): phục vụ dist bằng đúng Caddyfile của repo (CSP, cache, 404 thật, /health)
FROM caddy:2-alpine AS app
ENV PORT=8080
WORKDIR /srv
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv/dist
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/health || exit 1
