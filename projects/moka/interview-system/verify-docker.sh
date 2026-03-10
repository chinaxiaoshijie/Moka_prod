#!/bin/bash

# Docker 配置验证脚本

set -e

echo "======================================"
echo "Docker 配置验证"
echo "======================================"

# 检查 Docker 版本
echo -e "\n1. 检查 Docker 版本..."
docker_version=$(docker --version | awk '{print $3}' | sed 's/,//')
echo "Docker 版本: $docker_version"

# 检查 Docker Compose 版本
echo -e "\n2. 检查 Docker Compose 版本..."
compose_version=$(docker-compose --version | awk '{print $4}' | sed 's/,//')
echo "Docker Compose 版本: $compose_version"

# 检查环境变量文件
echo -e "\n3. 检查环境变量配置..."
if [ -f .env ]; then
    echo "✓ .env 文件存在"
    
    # 检查必需的环境变量
    required_vars=("MYSQL_ROOT_PASSWORD" "JWT_SECRET")
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if grep -q "^${var}=$" .env || ! grep -q "^${var}=" .env; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        echo "⚠️  以下环境变量未设置: ${missing_vars[*]}"
        echo "请在 .env 文件中设置这些变量"
    else
        echo "✓ 所需环境变量已设置"
    fi
else
    echo "⚠️  .env 文件不存在"
    echo "请从 .env.docker.example 复制: cp .env.docker.example .env"
fi

# 检查 docker-compose 配置
echo -e "\n4. 验证 docker-compose 配置..."
if [ -f docker-compose.optimized.yml ]; then
    echo "✓ docker-compose.optimized.yml 存在"
    
    # 验证配置语法
    if docker-compose -f docker-compose.optimized.yml config > /dev/null 2>&1; then
        echo "✓ docker-compose 配置语法正确"
    else
        echo "✗ docker-compose 配置有语法错误"
        exit 1
    fi
else
    echo "✗ docker-compose.optimized.yml 不存在"
    exit 1
fi

# 检查 Dockerfile
echo -e "\n5. 检查 Dockerfile..."
for dockerfile in backend/Dockerfile frontend/Dockerfile; do
    if [ -f "$dockerfile" ]; then
        echo "✓ $dockerfile 存在"
    else
        echo "✗ $dockerfile 不存在"
        exit 1
    fi
done

# 检查 .dockerignore
echo -e "\n6. 检查 .dockerignore 文件..."
for dockerignore in backend/.dockerignore frontend/.dockerignore; do
    if [ -f "$dockerignore" ]; then
        echo "✓ $dockerignore 存在"
    else
        echo "⚠️  $dockerignore 不存在（建议添加以优化构建）"
    fi
done

# 检查系统资源
echo -e "\n7. 检查系统资源..."
if command -v free &> /dev/null; then
    total_mem=$(free -m | awk '/Mem:/ {print $2}')
    echo "总内存: ${total_mem}MB"
    if [ "$total_mem" -lt 4096 ]; then
        echo "⚠️  内存不足 4GB，可能影响性能"
    else
        echo "✓ 内存充足"
    fi
fi

disk_space=$(df -h . | awk 'NR==2 {print $4}' | sed 's/G//')
echo "可用磁盘空间: ${disk_space}G"
if (( $(echo "$disk_space < 10" | bc -l) )); then
    echo "⚠️  磁盘空间不足 10GB"
else
    echo "✓ 磁盘空间充足"
fi

echo -e "\n======================================"
echo "验证完成"
echo "======================================"
