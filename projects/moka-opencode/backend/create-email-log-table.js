const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createEmailLogTable() {
  console.log('开始创建 InterviewEmailLog 表...\n');
  
  try {
    // 检查表是否已存在
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name = 'interviewemaillog'
    `;
    
    if (tables.length > 0) {
      console.log('✅ InterviewEmailLog 表已存在\n');
      return;
    }
    
    console.log('创建 InterviewEmailLog 表...');
    
    // 分开执行每个 SQL 语句 - 使用 TEXT 类型匹配 interviews 和 candidates 表的 id 类型
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "interviewemaillog" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "interviewId" TEXT NOT NULL,
        "candidateId" TEXT NOT NULL,
        "recipientEmail" TEXT NOT NULL,
        "subject" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "sentBy" TEXT NOT NULL,
        "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "status" TEXT NOT NULL DEFAULT 'sent',
        "errorMessage" TEXT,
        
        CONSTRAINT "interviewemaillog_pkey" PRIMARY KEY ("id")
      )
    `);
    console.log('  - 表结构创建成功');
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "interviewemaillog"
        ADD CONSTRAINT "interviewemaillog_interviewId_fkey"
        FOREIGN KEY ("interviewId") REFERENCES "interviews"("id") ON DELETE CASCADE
    `);
    console.log('  - interviewId 外键添加成功');
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "interviewemaillog"
        ADD CONSTRAINT "interviewemaillog_candidateId_fkey"
        FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE
    `);
    console.log('  - candidateId 外键添加成功');
    
    await prisma.$executeRawUnsafe(`
      CREATE INDEX "interviewemaillog_interviewId_idx" ON "interviewemaillog"("interviewId")
    `);
    console.log('  - interviewId 索引创建成功');
    
    await prisma.$executeRawUnsafe(`
      CREATE INDEX "interviewemaillog_candidateId_idx" ON "interviewemaillog"("candidateId")
    `);
    console.log('  - candidateId 索引创建成功');
    
    await prisma.$executeRawUnsafe(`
      CREATE INDEX "interviewemaillog_sentAt_idx" ON "interviewemaillog"("sentAt")
    `);
    console.log('  - sentAt 索引创建成功');
    
    console.log('\n✅ InterviewEmailLog 表创建成功\n');
    
    // 验证表结构
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'interviewemaillog'
      ORDER BY ordinal_position
    `;
    
    console.log('表结构:');
    columns.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      console.log(`  - ${col.column_name}: ${col.data_type} (${nullable})`);
    });
    
  } catch (error) {
    console.error('❌ 创建失败:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createEmailLogTable();
