const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  try {
    console.log('开始执行数据库迁移...');
    
    // 1. 检查是否已存在重复数据
    console.log('检查重复数据...');
    const duplicates = await prisma.$queryRaw`
      SELECT "processId", "roundNumber", COUNT(*) as count
      FROM interviews
      GROUP BY "processId", "roundNumber"
      HAVING COUNT(*) > 1
    `;
    
    if (duplicates.length > 0) {
      console.log('⚠️ 发现重复数据:', duplicates);
      console.log('清理重复数据...');
      await prisma.$executeRawUnsafe(`
        DELETE FROM interviews a USING interviews b
        WHERE a."processId" = b."processId" 
          AND a."roundNumber" = b."roundNumber" 
          AND a."createdAt" < b."createdAt"
      `);
      console.log('✅ 重复数据已清理');
    } else {
      console.log('✅ 无重复数据');
    }
    
    // 2. 添加复合唯一键约束
    console.log('添加复合唯一键约束...');
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "interviews" 
        ADD CONSTRAINT "interviews_processId_roundNumber_key" 
        UNIQUE ("processId", "roundNumber")
      `);
      console.log('✅ 唯一键约束添加成功');
    } catch (error) {
      if (error.code === '23505') {
        console.log('⚠️ 唯一键约束已存在');
      } else {
        throw error;
      }
    }
    
    // 3. 验证约束
    console.log('验证约束...');
    const constraints = await prisma.$queryRaw`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'interviews'
      AND constraint_name = 'interviews_processId_roundNumber_key'
    `;
    
    if (constraints.length > 0) {
      console.log('✅ 约束验证成功:', constraints);
    } else {
      console.log('⚠️ 约束验证失败');
    }
    
    console.log('\n✅ 数据库迁移完成！');
    
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
