# ========================================
# Production Dockerfile for Backend (NestJS)
# Using Debian for better Prisma compatibility
# ========================================
FROM node:20-bullseye AS deps

WORKDIR /app

# Use domestic Debian mirror (Tsinghua University)
RUN sed -i 's/deb.debian.org/deb.aliyun.com/g' /etc/apt/sources.list && \
    sed -i 's/deb.aliyun.com/deb.aliyun.com/g' /etc/apt/sources.list && \
    apt-get update

# Configure npm to use domestic registry
RUN npm config set registry https://registry.npmmirror.com/

# Install dependencies
COPY .npmrc package.json ./
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

# Install lark-cli for Feishu calendar integration
# Configure npm to use domestic registry first
RUN npm config set registry https://registry.npmmirror.com/ && \
    npm install -g @larksuite/cli && \
    mkdir -p /root/.lark-cli/cache && \
    chmod -R 755 /root/.lark-cli

# Expose port
EXPOSE 3001

# Start command with auto migration
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
