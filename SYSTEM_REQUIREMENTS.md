# Moka 面试管理系统 - 系统要求

## 🖥️ 服务器要求

### 最低配置

- **操作系统**: Ubuntu 20.04 LTS / Debian 11 或更高版本
- **CPU**: 2 核心
- **内存**: 4 GB RAM
- **存储**: 20 GB 可用磁盘空间
- **网络**: 开放端口 13000 (前端) 和 13001 (后端)

### 推荐配置

- **操作系统**: Ubuntu 22.04 LTS
- **CPU**: 4 核心
- **内存**: 8 GB RAM
- **存储**: 50 GB SSD
- **网络**: 静态IP地址，防火墙配置正确

## 🔧 软件依赖

### 必需组件

| 组件           | 版本要求 | 安装命令                                 |
| -------------- | -------- | ---------------------------------------- | --- |
| Docker         | 20.10+   | `curl -fsSL https://get.docker.com       | sh` |
| Docker Compose | 2.0+     | `sudo apt install docker-compose-plugin` |
| Git            | 2.25+    | `sudo apt install git`                   |

### 可选组件

| 组件    | 用途              | 安装命令                   |
| ------- | ----------------- | -------------------------- |
| Nginx   | SSL终止、负载均衡 | `sudo apt install nginx`   |
| Certbot | HTTPS证书         | `sudo apt install certbot` |

## 📋 部署前检查清单

### [ ] 系统环境检查

- [ ] 操作系统版本兼容
- [ ] 足够的磁盘空间
- [ ] 足够的内存
- [ ] 网络连接正常
- [ ] 防火墙配置允许端口 13000/13001

### [ ] 软件依赖检查

- [ ] Docker 已安装并运行
- [ ] Docker Compose 已安装
- [ ] Git 已安装
- [ ] 用户有Docker权限（或使用sudo）

### [ ] 网络配置检查

- [ ] 服务器IP: `10.10.2.131`
- [ ] 可访问外网（用于拉取Docker镜像）
- [ ] DNS解析正常
- [ ] 无代理配置冲突

## ⚡ 快速安装脚本

```bash
# 安装Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 安装Docker Compose v2
sudo apt update
sudo apt install docker-compose-plugin

# 安装Git
sudo apt install git -y

# 验证安装
docker --version
docker compose version
git --version
```

## 🔒 安全建议

1. **修改默认密码**: 部署后立即修改数据库密码和JWT密钥
2. **配置防火墙**: 只开放必要的端口 (13000, 13001)
3. **启用HTTPS**: 生产环境建议配置SSL证书
4. **定期备份**: 配置PostgreSQL数据备份策略
5. **监控日志**: 设置日志监控和告警

## 🚨 常见问题

### Docker权限问题

```bash
# 将用户添加到docker组
sudo usermod -aG docker malong
# 重新登录或执行
newgrp docker
```

### 端口冲突

```bash
# 检查端口占用
sudo ss -tlnp | grep -E '13000|13001'
# 修改端口配置在 .env 文件中
```

### 磁盘空间不足

```bash
# 清理Docker缓存
docker system prune -af
# 检查磁盘使用
df -h
```

## 📞 支持信息

- **项目仓库**: https://github.com/chinaxiaoshijie/Moka_prod
- **文档**: 查看项目根目录的 README.md
- **问题报告**: 在GitHub Issues中提交

---

**部署时间**: 约 5-10 分钟（取决于网络速度）
**维护成本**: 低（容器化部署，易于升级和维护）
