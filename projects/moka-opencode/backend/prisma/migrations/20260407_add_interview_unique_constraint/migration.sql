-- CreateTable
-- Add unique constraint to interviews table

-- 1. 先检查是否已存在重复数据
-- 如果存在，需要先清理（取消下面注释执行）
/*
DELETE FROM interviews a USING interviews b
WHERE a."processId" = b."processId" 
  AND a."roundNumber" = b."roundNumber" 
  AND a."createdAt" < b."createdAt";
*/

-- 2. 添加复合唯一键约束
ALTER TABLE "interviews" 
ADD CONSTRAINT "interviews_processId_roundNumber_key" 
UNIQUE ("processId", "roundNumber");

-- 3. 验证约束已添加
-- \d interviews (在 psql 中查看表结构)
