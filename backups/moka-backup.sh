#!/bin/bash
# Moka PostgreSQL 自动备份脚本
# 功能：备份数据库、压缩、保留 7 天、清理旧文件

set -euo pipefail

BACKUP_DIR="/home/malong/mokaproduct/Moka_prod/backups"
DB_HOST="127.0.0.1"
DB_PORT="5433"
DB_USER="moka"
DB_NAME="moka_db"
DB_PASS="ac709f2731f2c284e83cd7721ffc400ef8048f176a65097485864b53e48266ad"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/moka_db_backup_${DATE}.sql.gz"
RETENTION_DAYS=7

echo "[$(date)] 开始备份 Moka 数据库..."

# 执行备份（压缩）
docker run --rm --network host \
  -e PGPASSWORD="${DB_PASS}" \
  postgres:15-alpine \
  pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} \
  | gzip > "${BACKUP_FILE}"

# 验证备份文件
if [ -f "${BACKUP_FILE}" ] && [ -s "${BACKUP_FILE}" ]; then
    SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "[$(date)] 备份完成: ${BACKUP_FILE} (${SIZE})"
else
    echo "[$(date)] 备份失败！文件不存在或为空"
    rm -f "${BACKUP_FILE}"
    exit 1
fi

# 清理过期备份
echo "[$(date)] 清理 ${RETENTION_DAYS} 天前的旧备份..."
find "${BACKUP_DIR}" -name "moka_db_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

# 显示当前备份列表
echo "[$(date)] 当前保留的备份:"
ls -lh "${BACKUP_DIR}"/moka_db_backup_*.sql.gz 2>/dev/null | awk '{print "  "$9, "(" $5 ")"}'

echo "[$(date)] 备份任务完成"
