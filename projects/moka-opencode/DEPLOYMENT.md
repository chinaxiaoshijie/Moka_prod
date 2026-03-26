# Moka 面试管理系统 - 生产环境部署指南

## 前置要求

| 组件 | 最低版本 | 说明 |
|------|----------|------|
| Docker | 20.10+ | 容器运行环境 |
| Docker Compose | 1.29+ / v2 | 服务编排 |
| 内存 | 2GB+ | 建议 4GB |
| 磁盘 | 10GB+ | 含数据库存储 |

---

## 快速部署（5 步）

### 第一步：获取代码

```bash
git clone https://github.com/chinaxiaoshijie/Moka_prod.git
cd Moka_prod/projects/moka-opencode
```

### 第二步：配置环境变量

```bash
cat > .env << 'EOF'
# ======== 数据库 ========
POSTGRES_USER=moka
POSTGRES_PASSWORD=<请替换为强密码>
POSTGRES_DB=moka_db
POSTGRES_PORT=5432

# ======== 后端 ========
BACKEND_PORT=13001
JWT_SECRET=<请替换为随机64位字符串>
JWT_EXPIRES_IN=7d

# ======== 前端 ========
FRONTEND_PORT=13000
NEXT_PUBLIC_API_URL=http://backend:3001

# ======== CORS ========
FRONTEND_URL=http://<服务器IP>:13000

# ======== 邮件 (飞书 SMTP) ========
SMTP_HOST=smtp.feishu.cn
SMTP_PORT=465
SMTP_USER=hrgroup@malong.com
SMTP_PASS=<SMTP密码>
SMTP_FROM=hrgroup@malong.com
EOF
```

**生成安全密钥：**

```bash
# 生成 JWT_SECRET
openssl rand -hex 32

# 生成 POSTGRES_PASSWORD
openssl rand -hex 16
```

### 第三步：启动服务

```bash
docker-compose up -d --build
```

等待所有服务健康（约 2-3 分钟）：

```bash
docker-compose ps
```

预期输出：
```
Name              State       Ports
moka-postgres     Up (healthy)   0.0.0.0:5432->5432/tcp
moka-backend      Up (healthy)   0.0.0.0:13001->3001/tcp
moka-frontend     Up (healthy)   0.0.0.0:13000->3000/tcp
```

### 第四步：验证部署

```bash
# 后端健康检查
curl http://localhost:13001/health

# 前端页面
curl -s -o /dev/null -w "%{http_code}" http://localhost:13000/login
# 应返回 200
```

### 第五步：首次登录

浏览器访问 `http://<服务器IP>:13000`

默认账户（**登录后请立即修改密码**）：

| 角色 | 用户名 | 密码 |
|------|--------|------|
| HR 管理员 | hr | hr123456 |
| 面试官 | interviewer | interviewer123 |

---

## 部署架构

```
用户浏览器
    │
    ▼
┌─────────────────────────────────┐
│  Frontend (Port 13000)          │
│  ├── Nginx (反向代理)            │
│  │   ├── /api/* → Backend:3001  │
│  │   ├── /uploads/* → Backend   │
│  │   └── /* → Next.js SSR       │
│  └── Next.js (页面渲染)          │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  Backend (Port 13001)           │
│  ├── NestJS API                 │
│  ├── JWT 认证                    │
│  ├── Helmet 安全头               │
│  └── Nodemailer (飞书SMTP)      │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  PostgreSQL (Port 5432)         │
│  └── Prisma ORM                 │
└─────────────────────────────────┘
```

---

## 端口规划

| 服务 | 内部端口 | 外部端口 | 说明 |
|------|----------|----------|------|
| PostgreSQL | 5432 | 5432 | 建议生产环境**不外露**此端口 |
| Backend API | 3001 | 13001 | NestJS API 服务 |
| Frontend | 3000 | 13000 | Next.js + Nginx |

> **内网部署**：防火墙只需开放 `13000`（前端）端口，后端 API 由前端 Nginx 反向代理。

---

## 数据库管理

### 自动迁移

后端容器启动时自动执行 `prisma migrate deploy`，无需手动操作。

### 定时备份

```bash
# 创建备份目录
mkdir -p /data/backups

# 添加定时备份 (每天凌晨 3 点)
crontab -e
```

添加以下内容：

```cron
# 每天凌晨 3 点备份数据库
0 3 * * * docker exec moka-postgres pg_dump -U moka moka_db | gzip > /data/backups/moka_$(date +\%Y\%m\%d).sql.gz

# 保留最近 30 天备份
0 4 * * * find /data/backups -name "moka_*.sql.gz" -mtime +30 -delete
```

### 手动备份

```bash
docker exec moka-postgres pg_dump -U moka moka_db | gzip > moka_backup.sql.gz
```

### 数据恢复

```bash
gunzip < moka_backup.sql.gz | docker exec -i moka-postgres psql -U moka moka_db
```

---

## 日常运维

### 查看日志

```bash
# 所有服务
docker-compose logs -f

# 单个服务（最近 100 行）
docker-compose logs -f --tail=100 backend
```

### 重启服务

```bash
# 重启全部
docker-compose restart

# 重启单个
docker-compose restart backend
```

### 更新部署

```bash
git pull
docker-compose up -d --build
```

### 数据持久化 Volume

| Volume | 内容 | 重要性 |
|--------|------|--------|
| `postgres_data` | 数据库文件 | **关键** - 必须备份 |
| `backend-uploads` | 上传的简历文件 | **重要** - 建议备份 |

---

## 安全配置

### 已内置的安全措施

| 措施 | 说明 |
|------|------|
| JWT 认证 | 所有 API 端点需登录访问 |
| bcrypt 加密 | 密码 10 轮 salt 加密存储 |
| Helmet | HTTP 安全响应头 |
| CORS 限制 | 仅允许前端域名跨域 |
| 参数验证 | class-validator 白名单模式 |
| SQL 防注入 | Prisma ORM 参数化查询 |

### 生产环境建议

**1. 关闭数据库外部端口**

编辑 `docker-compose.yml`，注释掉 postgres 的 ports：

```yaml
postgres:
  # ports:
  #   - "${POSTGRES_PORT:-5432}:5432"
```

**2. 防火墙规则**

```bash
# Ubuntu/Debian (ufw)
ufw allow 13000/tcp
ufw enable

# CentOS/RHEL (firewalld)
firewall-cmd --permanent --add-port=13000/tcp
firewall-cmd --reload
```

**3. SSL/TLS（如需 HTTPS）**

在服务器上部署 Nginx 反向代理：

```nginx
server {
    listen 443 ssl;
    server_name moka.malong.com;

    ssl_certificate     /etc/ssl/moka.crt;
    ssl_certificate_key /etc/ssl/moka.key;

    location / {
        proxy_pass http://127.0.0.1:13000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 邮件通知

### 配置

| 配置项 | 值 |
|--------|-----|
| SMTP 地址 | smtp.feishu.cn |
| 端口 | 465 (SSL) |
| 发件人 | hrgroup@malong.com |
| 限制 | 200封/100秒，6000封/天 |

### 邮件触发场景

| 场景 | 收件人 |
|------|--------|
| 安排面试 | 面试官 + 候选人(可选) |
| 轮次完成 | HR |
| 流程结束（录用/拒绝） | HR |
| @面试官查看简历 | 被@的面试官 |

### 验证邮件是否正常

```bash
docker-compose logs backend | grep "EmailService"
# 正常: [EmailService] SMTP transporter initialized
# 异常: [EmailService] SMTP not configured, using console logging mode
```

---

## 故障排查

### 服务无法启动

```bash
docker-compose ps                          # 查看容器状态
docker-compose logs --tail=50 backend      # 查看启动日志
```

### 数据库连接失败

```bash
docker exec moka-postgres pg_isready -U moka
docker exec -it moka-postgres psql -U moka -d moka_db
```

### 前端无法访问后端 API

```bash
curl http://localhost:13001/health
docker exec moka-frontend cat /var/log/nginx/error.log
```

### 邮件发送失败

```bash
docker-compose logs backend | grep -i "email\|smtp"
```

---

## 部署验证清单

部署完成后逐项确认：

- [ ] `.env` 已配置，`JWT_SECRET` 和 `POSTGRES_PASSWORD` 使用强密码
- [ ] SMTP 凭据已配置，邮件可正常发送
- [ ] `FRONTEND_URL` 已设为实际服务器地址
- [ ] 三个容器均 `Up (healthy)` 状态
- [ ] 前端页面可正常访问和登录
- [ ] 防火墙仅开放 13000 端口
- [ ] 数据库备份定时任务已配置
- [ ] 默认账户密码已修改

---

## 技术栈

| 组件 | 技术 |
|------|------|
| 前端 | Next.js 16, React 19, TailwindCSS 4 |
| 后端 | NestJS 11, Prisma 5, Bun |
| 数据库 | PostgreSQL 15 |
| Web 服务器 | Nginx |
| 容器 | Docker, Docker Compose |
| 邮件 | Nodemailer + 飞书 SMTP |

## 镜像源优化（国内部署）

### 已配置的国内镜像源

| 组件 | 镜像源 | 配置位置 |
|------|--------|----------|
| NPM | `registry.npmmirror.com` | `.npmrc` |
| Debian (Backend) | `mirrors.tuna.tsinghua.edu.cn` | `backend/Dockerfile` |
| Alpine (Frontend) | `mirrors.tuna.tsinghua.edu.cn` | `frontend/Dockerfile` |

### 镜像源说明

- **npm**: 使用淘宝 NPM 镜像 (npmmirror.com)，加速 node_modules 安装
- **Debian**: 清华大学镜像站，加速 Debian 包管理
- **Alpine**: 清华大学镜像站，加速 Alpine 包管理

### 如需切换镜像源

**修改 .npmrc:**

```bash
# .npmrc
registry=https://registry.npmmirror.com/  # 淘宝
# registry=https://registry.yarnpkg.com/  # Yarn
# registry=https://r.cnpmjs.org/          # CNPM
```

**修改 Dockerfile 中的 apt/apk 源:**

```dockerfile
# Debian
RUN sed -i 's/deb.debian.org/mirrors.163.com/g' /etc/apt/sources.list

# Alpine  
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories
```
