# ========================================
# Production Dockerfile for Frontend (Next.js)
# ========================================
# Stage 1: Dependencies
FROM oven/bun:1-alpine AS deps

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile --production

# ========================================
# Stage 2: Builder
FROM oven/bun:1-alpine AS builder

# Install npm for Next.js build
RUN apk add --no-cache npm

WORKDIR /app

# Copy dependency files from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock* ./
COPY next.config.* ./
COPY tailwind.config.* ./
COPY postcss.config.* ./
COPY tsconfig.json ./
COPY next-env.d.ts ./
COPY src ./src

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED 1

# Build the application
RUN bun run build

# ========================================
# Stage 3: Runner (Production with nginx)
FROM node:20-alpine AS runner

WORKDIR /app

# Install nginx and curl for health check
RUN apk add --no-cache nginx curl

# Copy built files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/package.json ./

# Copy nginx configuration
COPY nginx.conf /etc/nginx/http.d/default.conf

# Create necessary directories
RUN mkdir -p /app/.next/cache

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED 1

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start nginx and node server
CMD ["sh", "-c", "node server.js & nginx -g 'daemon off;'"]
