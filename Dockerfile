# Single-container build: frontend static assets get baked into the backend image,
# backend serves both the API and the SPA. Deploy is just this one image + Mongo (Atlas or otherwise).

FROM oven/bun:1 AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/bun.lock* ./
RUN bun install
COPY frontend/ ./
RUN bun run build

FROM oven/bun:1 AS backend
WORKDIR /app
COPY backend/package.json backend/bun.lock* ./
RUN bun install --production
COPY backend/src ./src
RUN mkdir -p thumbnails
COPY --from=frontend-build /app/frontend/dist ./public

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD bun -e "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["bun", "src/server.js"]
