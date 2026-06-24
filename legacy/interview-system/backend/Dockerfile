# 后端 Dockerfile
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 安装 dumb-init 和 wget，用于处理信号和健康检查
RUN apk add --no-cache dumb-init wget

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production && npm cache clean --force

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001

# 复制应用代码
COPY --chown=backend:nodejs . .

# 创建必要的目录
RUN mkdir -p uploads logs && \
    chown -R backend:nodejs uploads logs

# 切换到非 root 用户
USER backend

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "const http = require('http'); \
    const options = { host: 'localhost', port: 3000, path: '/health', timeout: 2000 }; \
    const request = http.request(options, (res) => { \
        console.log(\`STATUS: \${res.statusCode}\`); \
        process.exitCode = res.statusCode === 200 ? 0 : 1; \
    }); \
    request.on('error', () => process.exitCode = 1); \
    request.end();"

# 启动应用
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/app.js"]