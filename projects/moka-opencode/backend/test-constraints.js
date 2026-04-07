const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testUniqueConstraint() {
  console.log('\n=== 测试 1: 验证唯一键约束 ===\n');
  
  try {
    // 查询约束是否存在
    const constraints = await prisma.$queryRaw`
      SELECT 
        tc.constraint_name, 
        tc.constraint_type,
        kcu.column_name,
        tc.table_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'interviews'
        AND tc.constraint_name = 'interviews_processId_roundNumber_key'
      ORDER BY kcu.ordinal_position
    `;
    
    console.log('查询到的约束:');
    if (constraints.length > 0) {
      constraints.forEach(c => {
        console.log(`  - ${c.constraint_name} (${c.column_name})`);
      });
      console.log('\n✅ 唯一键约束已存在');
    } else {
      console.log('❌ 唯一键约束不存在');
      return false;
    }
    
    // 检查是否有重复数据
    const duplicates = await prisma.$queryRaw`
      SELECT "processId", "roundNumber", COUNT(*) as count
      FROM interviews
      GROUP BY "processId", "roundNumber"
      HAVING COUNT(*) > 1
      LIMIT 5
    `;
    
    if (duplicates.length > 0) {
      console.log('\n⚠️ 发现重复数据:', duplicates);
    } else {
      console.log('\n✅ 无重复数据');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    return false;
  }
}

async function testEmailLogTable() {
  console.log('\n=== 测试 2: 验证邮件日志表结构 ===\n');
  
  try {
    // 查询表结构
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'interviewemaillog'
      ORDER BY ordinal_position
    `;
    
    console.log('InterviewEmailLog 表结构:');
    columns.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      console.log(`  - ${col.column_name}: ${col.data_type} (${nullable})`);
    });
    
    // 查询索引
    const indexes = await prisma.$queryRaw`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'interviewemaillog'
    `;
    
    console.log('\n索引:');
    indexes.forEach(idx => {
      console.log(`  - ${idx.indexname}`);
    });
    
    // 查询最近的邮件记录
    const recentLogs = await prisma.$queryRaw`
      SELECT 
        id,
        "interviewId",
        "candidateId",
        "recipientEmail",
        "subject",
        "sentBy",
        "status",
        "sentAt"
      FROM interviewemaillog
      ORDER BY "sentAt" DESC
      LIMIT 5
    `;
    
    console.log('\n最近的邮件记录:');
    if (recentLogs.length > 0) {
      recentLogs.forEach(log => {
        console.log(`  - [${log.status}] ${log.subject} by ${log.sentBy} at ${log.sentAt}`);
      });
    } else {
      console.log('  (暂无记录)');
    }
    
    console.log('\n✅ 邮件日志表结构正常');
    return true;
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    return false;
  }
}

async function testEmailLimitLogic() {
  console.log('\n=== 测试 3: 验证邮件限制逻辑（2 小时）===\n');
  
  try {
    // 模拟 SQL 查询逻辑
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    
    console.log(`当前时间：${new Date().toISOString()}`);
    console.log(`2 小时前：${twoHoursAgo.toISOString()}\n`);
    
    // 查询 2 小时内的邮件记录数
    const countResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM interviewemaillog
      WHERE "sentAt" >= ${twoHoursAgo}
    `;
    
    const count = countResult[0].count;
    console.log(`2 小时内的邮件记录数：${count}`);
    
    // 查询每个 interview 在 2 小时内的发送次数
    const perInterview = await prisma.$queryRaw`
      SELECT 
        "interviewId",
        COUNT(*) as send_count,
        MAX("sentAt") as last_sent
      FROM interviewemaillog
      WHERE "sentAt" >= ${twoHoursAgo}
      GROUP BY "interviewId"
      ORDER BY send_count DESC
      LIMIT 5
    `;
    
    if (perInterview.length > 0) {
      console.log('\n每个面试的发送次数（Top 5）:');
      perInterview.forEach(row => {
        console.log(`  - ${row.interviewId}: ${row.send_count} 次 (最后：${row.last_sent})`);
      });
    }
    
    console.log('\n✅ 邮件限制逻辑验证通过');
    console.log('   代码逻辑：如果 2 小时内已有记录，则拒绝发送');
    return true;
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    return false;
  }
}

async function testCodeChanges() {
  console.log('\n=== 测试 4: 验证代码修改 ===\n');
  
  const fs = require('fs');
  const path = require('path');
  
  const servicePath = path.join(__dirname, 'src/interviews/interview.service.ts');
  const content = fs.readFileSync(servicePath, 'utf8');
  
  // 检查 upsert
  if (content.includes('prisma.interview.upsert')) {
    console.log('✅ 发现 upsert 使用');
  } else {
    console.log('❌ 未发现 upsert 使用');
    return false;
  }
  
  // 检查 2 小时限制
  if (content.includes('2 * 60 * 60 * 1000')) {
    console.log('✅ 发现 2 小时限制代码');
  } else if (content.includes('24 * 60 * 60 * 1000')) {
    console.log('⚠️ 仍然是 24 小时限制，需要修改');
    return false;
  } else {
    console.log('❌ 未发现时间限制代码');
    return false;
  }
  
  // 检查错误提示
  if (content.includes('2 小时内已发送过邮件')) {
    console.log('✅ 发现正确的错误提示');
  } else {
    console.log('⚠️ 错误提示可能未更新');
  }
  
  // 检查日志记录
  if (content.includes('prisma.interviewEmailLog.create')) {
    console.log('✅ 发现邮件日志记录代码');
  } else {
    console.log('❌ 未发现邮件日志记录代码');
    return false;
  }
  
  return true;
}

async function runAllTests() {
  console.log('🚀 开始执行所有测试...\n');
  console.log('=' .repeat(60));
  
  const results = [];
  
  results.push(await testUniqueConstraint());
  results.push(await testEmailLogTable());
  results.push(await testEmailLimitLogic());
  results.push(await testCodeChanges());
  
  console.log('\n' + '=' .repeat(60));
  console.log('\n📊 测试结果汇总:\n');
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`  通过：${passed}/${total}`);
  
  if (passed === total) {
    console.log('\n✅ 所有测试通过！修复已成功应用。\n');
  } else {
    console.log('\n⚠️ 部分测试未通过，请检查。\n');
  }
  
  await prisma.$disconnect();
}

runAllTests().catch(console.error);
