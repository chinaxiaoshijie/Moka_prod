# ========================================
# Makefile for Moka Interview System
# ========================================

# Colors
GREEN = \033[0;32m
YELLOW = \033[1;33m
BLUE = \033[0;34m
NC = \033[0m # No Color

# Default target
.PHONY: help
help:
	@echo ""
	@echo "${BLUE}Moka 面试管理系统 - 部署命令${NC}"
	@echo ""
	@echo "使用方式: ${GREEN}make <target>${NC}"
	@echo ""
	@echo "${YELLOW}开发环境:${NC}"
	@echo "  dev          - 启动开发环境"
	@echo "  dev-backend  - 仅启动后端开发服务"
	@echo "  dev-frontend - 仅启动前端开发服务"
	@echo ""
	@echo "${YELLOW}生产环境:${NC}"
	@echo "  build        - 构建生产镜像"
	@echo "  up           - 启动生产环境"
	@echo "  down         - 停止所有服务"
	@echo "  restart      - 重启所有服务"
	@echo ""
	@echo "${YELLOW}数据库:${NC}"
	@echo "  db-migrate   - 运行数据库迁移"
	@echo "  db-seed      - 种子数据"
	@echo "  db-reset     - 重置数据库 (⚠️ 删除所有数据)"
	@echo "  db-backup    - 备份数据库"
	@echo "  db-restore   - 恢复数据库"
	@echo ""
	@echo "${YELLOW}日志:${NC}"
	@echo "  logs         - 查看所有日志"
	@echo "  logs-backend - 查看后端日志"
	@echo "  logs-frontend- 查看前端日志"
	@echo ""
	@echo "${YELLOW}维护:${NC}"
	@echo "  clean        - 清理 Docker 资源"
	@echo "  ps           - 查看服务状态"
	@echo "  shell-backend- 进入后端容器"
	@echo "  shell-frontend- 进入前端容器"
	@echo ""

# ========================================
# Development
# ========================================
.PHONY: dev
dev:
	@echo "${GREEN}启动开发环境...${NC}"
	docker-compose -f docker-compose.dev.yml up -d

.PHONY: dev-backend
dev-backend:
	@echo "${GREEN}启动后端开发服务...${NC}"
	cd backend && bun run dev

.PHONY: dev-frontend
dev-frontend:
	@echo "${GREEN}启动前端开发服务...${NC}"
	cd frontend && bun run dev

# ========================================
# Production
# ========================================
.PHONY: build
build:
	@echo "${GREEN}构建生产镜像...${NC}"
	docker-compose build --no-cache

.PHONY: up
up:
	@echo "${GREEN}启动生产环境...${NC}"
	@if [ ! -f .env ]; then \
		echo "${YELLOW}警告: .env 文件不存在，正在创建...${NC}"; \
		cp .env.production.example .env; \
	fi
	docker-compose up -d
	@echo "${GREEN}服务已启动!${NC}"
	@echo "前端: http://localhost:3000"
	@echo "后端: http://localhost:3001"

.PHONY: down
down:
	@echo "${YELLOW}停止所有服务...${NC}"
	docker-compose down

.PHONY: restart
restart:
	@echo "${GREEN}重启所有服务...${NC}"
	docker-compose restart

# ========================================
# Database
# ========================================
.PHONY: db-migrate
db-migrate:
	@echo "${GREEN}运行数据库迁移...${NC}"
	docker-compose exec backend bunx prisma migrate deploy

.PHONY: db-seed
db-seed:
	@echo "${GREEN}运行数据库种子...${NC}"
	docker-compose exec backend bunx prisma db seed

.PHONY: db-reset
db-reset:
	@echo "${YELLOW}⚠️  警告: 将删除所有数据库数据!${NC}"
	@read -p "确认继续? (y/n) " -n 1 -r; \
	echo; \
	if [[ ! $$REPLY =~ ^[Yy]$$ ]]; then \
		echo "已取消"; \
	else \
		docker-compose down -v; \
		docker-compose up -d; \
	fi

.PHONY: db-backup
db-backup:
	@echo "${GREEN}备份数据库...${NC}"
	mkdir -p backups
	docker-compose exec -T postgres pg_dump -U moka moka_db > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "${GREEN}备份完成!${NC}"

.PHONY: db-restore
db-restore:
	@echo "${YELLOW}请在 backups 目录中选择要恢复的文件:${NC}"
	@ls -la backups/
	@read -p "输入文件名: " filename; \
	docker-compose exec -T postgres psql -U moka moka_db < backups/$$filename

# ========================================
# Logs
# ========================================
.PHONY: logs
logs:
	docker-compose logs -f

.PHONY: logs-backend
logs-backend:
	docker-compose logs -f backend

.PHONY: logs-frontend
logs-frontend:
	docker-compose logs -f frontend

# ========================================
# Maintenance
# ========================================
.PHONY: clean
clean:
	@echo "${YELLOW}清理 Docker 资源...${NC}"
	docker-compose down -v
	docker system prune -f
	@echo "${GREEN}清理完成!${NC}"

.PHONY: ps
ps:
	docker-compose ps

.PHONY: shell-backend
shell-backend:
	docker-compose exec backend sh

.PHONY: shell-frontend
shell-frontend:
	docker-compose exec frontend sh
