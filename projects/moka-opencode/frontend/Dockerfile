# ========================================
# Production Dockerfile for Frontend (Next.js 16)
# Using Node.js with standalone output
# ========================================

FROM node:20-alpine AS builder

WORKDIR /app

# Use domestic Alpine mirror (Tsinghua University)
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories && \
    apk update

# Configure npm to use domestic registry
RUN npm config set registry https://registry.npmmirror.com/

# Install dependencies
COPY .npmrc package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# Copy source files
COPY . .

# Build application
RUN npm run build

# Stage 2: Runner
FROM node:20-alpine AS runner

WORKDIR /app

# Install nginx
RUN apk add --no-cache nginx curl

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY nginx.conf /etc/nginx/http.d/default.conf

RUN mkdir -p /app/.next/cache

ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED 1

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

CMD ["sh", "-c", "node server.js & nginx -g 'daemon off;'"]
