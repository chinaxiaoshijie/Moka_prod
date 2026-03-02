FROM oven/bun:1-alpine

WORKDIR /app

# 复制package文件
COPY package.json bun.lock* ./

# 安装依赖
RUN bun install --production

# 复制源代码和构建产物
COPY . .

# 构建（如果尚未构建）
RUN bun run build || true

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["bun", "run", "start"]
