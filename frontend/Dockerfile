# ========================================
# Production Dockerfile for Frontend (Next.js)
# ========================================
# Stage 1: Dependencies
FROM oven/bun:1-alpine AS deps

WORKDIR /app

# Copy package files
# Copy package files
COPY package.json ./package.json

# Install dependencies
RUN bun install --production

# ========================================
# Stage 2: Builder
# =======================================
# Stage 2: Builder
# =======================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install bun for dependency management
RUN npm install -g bun

# Copy dependency files
COPY package.json ./package.json


# Install dependencies with bun
RUN bun install

# Copy source files
COPY next.config.* ./
# tailwind.config.* file doesn't exist, skip it
COPY postcss.config.* ./
COPY tsconfig.json ./
COPY next-env.d.ts ./
COPY src ./src

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application with Next.js
RUN bun run build

# ========================================
# Stage 3: Runner (Production with nginx)
FROM node:20-alpine AS runner

WORKDIR /app

# Install nginx and curl for health check
RUN apk add --no-cache nginx curl

# Copy built files
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# Copy public assets from source (not from builder)
COPY public ./public
COPY --from=builder /app/package.json ./

# Copy nginx configuration
COPY nginx.conf /etc/nginx/http.d/default.conf

# Create necessary directories
RUN mkdir -p /app/.next/cache

# Set environment variables
ENV NODE_ENV=production
ENV PORT=13000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

# Expose port
EXPOSE 13000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:13000/health || exit 1

# Start nginx and node server
CMD ["sh", "-c", "node server.js & nginx -g 'daemon off;'"]
