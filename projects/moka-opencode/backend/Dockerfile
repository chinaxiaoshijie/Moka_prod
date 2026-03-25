# ========================================
# Production Dockerfile for Backend (NestJS)
# Using Debian for better Prisma compatibility
# ========================================
FROM node:20-bullseye AS deps

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install --legacy-peer-deps

# ========================================
# Stage 2: Builder
FROM node:20-bullseye AS builder

WORKDIR /app

# Install TypeScript globally
RUN npm install -g typescript

# Install Prisma CLI globally
RUN npm install -g prisma@5.22.0

# Copy dependency files from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY tsconfig.json ./
COPY tsconfig.build.json ./
COPY prisma ./prisma
COPY src ./src

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Compile seed script separately
RUN npx tsc prisma/seed.ts --outDir dist/prisma --esModuleInterop --skipLibCheck --resolveJsonModule --module commonjs --target ES2021 --ignoreConfig

# ========================================
# Stage 3: Runner (Production)
FROM node:20-bullseye AS runner

WORKDIR /app

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
COPY prisma ./prisma

# Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Expose port
EXPOSE 3001

# Start command with auto migration
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
