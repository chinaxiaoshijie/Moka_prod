# ========================================
# Production Dockerfile for Backend (NestJS)
# ========================================
# Stage 1: Dependencies
FROM node:18-alpine AS deps

WORKDIR /app

# Copy package files
COPY package.json ./package.json

# Install dependencies
RUN npm install --production

# ========================================
# Stage 2: Builder
FROM node:18-alpine AS builder

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
RUN npx prisma generate

# Copy source files
COPY src ./src

# Build TypeScript
RUN npm run build

# ========================================
# Stage 3: Runner (Production)
FROM node:18-alpine AS runner

WORKDIR /app

# Security: Run as non-root user
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 --ingroup nodejs --create-home --shell /bin/bash appuser

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY prisma ./prisma
COPY .prisma ./.prisma

# Change ownership
RUN chown -R appuser:nodejs /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 13001

# Start command
CMD ["node", "dist/main.js"]
