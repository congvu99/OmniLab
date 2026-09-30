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

# Stage 2: phục vụ dist bằng đúng Caddyfile của repo (CSP, cache, 404 thật, /health)
FROM caddy:2-alpine
ENV PORT=8080
WORKDIR /srv
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv/dist
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/health || exit 1
