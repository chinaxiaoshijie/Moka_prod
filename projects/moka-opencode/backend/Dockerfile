# ========================================
# Production Dockerfile for Backend (NestJS)
# ========================================
# Stage 1: Dependencies
FROM oven/bun:1-alpine AS deps

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies (including prisma)
RUN bun install --frozen-lockfile --production

# ========================================
# Stage 2: Builder
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy dependency files from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock* ./
COPY prisma ./prisma
COPY tsconfig.build.json ./
COPY src ./src

# Generate Prisma client
RUN bunx prisma generate

# Build TypeScript
RUN bun run build

# ========================================
# Stage 3: Runner (Production)
FROM oven/bun:1-alpine AS runner

WORKDIR /app

# Security: Run as non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY prisma ./prisma

# Create production .env file template
COPY --from=builder /app/.env.production.example ./.env 2>/dev/null || true

# Change ownership
RUN chown -R appuser:nodejs /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD bunx curl -f http://localhost:3001/health || exit 1

# Start command
CMD ["bun", "run", "dist/main.js"]
