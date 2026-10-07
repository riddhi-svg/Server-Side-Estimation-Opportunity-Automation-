# ==========================================
# Multi-Stage Dockerfile for sGTM Speed Automation
# ==========================================

# ------------------------------------------
# Stage 1: Build & Verify (TypeScript + Vite + Tests)
# ------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Prevent Puppeteer Chromium download during build
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

COPY package*.json ./

RUN npm ci

COPY . .

# Run linting, unit test suite, and frontend bundle build
RUN npm run lint && npm test && npm run build

# ------------------------------------------
# Stage 2: Minimal Production Runtime
# ------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Copy dependencies manifest and install production-only modules
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copy backend source code and compiled frontend bundle
COPY src/backend ./src/backend
COPY --from=builder /app/dist ./dist

# Security: Run as unprivileged node user
USER node

EXPOSE 3000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/healthz || exit 1

CMD ["node", "src/backend/server.js"]
