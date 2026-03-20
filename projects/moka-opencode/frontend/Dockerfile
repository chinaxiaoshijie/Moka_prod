# ========================================
# Production Dockerfile for Frontend (Next.js)
# ========================================
# Stage 1: Dependencies
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files
COPY package.json ./package.json

# Install dependencies
RUN npm install --production

# ========================================
# Stage 2: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Install ALL dependencies (including devDependencies for TypeScript)
COPY package.json ./package.json
RUN npm install --legacy-peer-deps

# Copy source files
COPY next.config.* ./
COPY postcss.config.* ./
COPY tsconfig.json ./
COPY next-env.d.ts ./
COPY src ./src

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application with Next.js
RUN npm run build

# ========================================
# Stage 3: Runner (Production)
FROM node:20-alpine AS runner

WORKDIR /app

# Install curl for health check
RUN apk add --no-cache curl

# Copy all necessary files
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
COPY public ./public

# Set environment variables
ENV NODE_ENV=production
ENV PORT=13000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

# Expose port
EXPOSE 13000

# Start Next.js production server
CMD ["npx", "next", "start", "--hostname", "0.0.0.0"]
