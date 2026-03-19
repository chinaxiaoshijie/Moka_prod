#!/bin/bash

# 生成 Prisma Client 并复制到正确位置
echo "Generating Prisma Client..."
bunx prisma generate

# 创建 .prisma/client 目录
mkdir -p .prisma/client

# 复制生成的文件
cp -r node_modules/.prisma/client/* .prisma/client/ 2>/dev/null || true
cp -r node_modules/@prisma/client/* .prisma/client/ 2>/dev/null || true

# 如果上面失败，尝试其他位置
if [ ! -f ".prisma/client/index.js" ]; then
    echo "Trying alternative Prisma client location..."
    find . -name "default.js" -path "*/.prisma/client/*" -exec cp {} .prisma/client/ \; 2>/dev/null || true
fi

echo "Prisma Client generation completed!"
ls -la .prisma/client/