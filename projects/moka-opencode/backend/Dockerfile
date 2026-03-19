# ========================================
# Production Dockerfile for Backend (NestJS)
# ========================================
# Stage 1: Dependencies
FROM oven/bun:1 AS deps

WORKDIR /app

# Copy package files
COPY package.json ./package.json

# Install dependencies
RUN bun install --production

# ========================================
# Stage 2: Builder
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy dependency files from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./package.json
COPY tsconfig.json ./
COPY tsconfig.build.json ./

# Copy prisma schema
COPY prisma ./prisma

# Copy pre-generated Prisma client
COPY .prisma ./.prisma

# Generate Prisma client in node_modules (for TypeScript resolution)
RUN bunx prisma generate

# Copy source files
COPY src ./src

# Build TypeScript
RUN bun run build

# ========================================
# Stage 3: Runner (Production)
FROM oven/bun:1 AS runner

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

# Change ownership
RUN chown -R appuser:nodejs /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 13001

# Start command
CMD ["bun", "run", "dist/main.js"]
