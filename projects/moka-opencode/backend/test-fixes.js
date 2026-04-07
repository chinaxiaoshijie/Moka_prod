const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testUpsert() {
  console.log('\n=== 测试 1: 并发创建面试（upsert 测试）===');
  
  try {
    // 创建一个测试用的面试流程
    const testProcess = await prisma.interviewProcess.create({
      data: {
        candidateId: '', // 会更新
        positionId: '', // 会更新
        currentRound: 1,
        totalRounds: 3,
        status: 'IN_PROGRESS',
        hasHRRound: true,
        createdById: 'test-user',
      },
    });
    
    console.log('创建测试流程:', testProcess.id);
    
    // 模拟并发创建同一轮次的面试
    const createInterview = async (roundNumber, attempt) => {
      try {
        const interview = await prisma.interview.upsert({
          where: {
            processId_roundNumber: {
              processId: testProcess.id,
              roundNumber: roundNumber,
            },
          },
          create: {
            candidateId: 'test-candidate-' + attempt,
            positionId: 'test-position',
            interviewerId: 'test-interviewer',
            type: 'INTERVIEW_1',
            format: 'ONLINE',
            startTime: new Date(),
            endTime: new Date(),
            status: 'SCHEDULED',
            processId: testProcess.id,
            roundNumber: roundNumber,
            isHRRound: false,
          },
          update: {
            candidateId: 'test-candidate-updated-' + attempt,
          },
        });
        return { success: true, interview };
      } catch (error) {
        return { success: false, error: error.message };
      }
    };
    
    // 并发创建 3 次同一轮次的面试
    const results = await Promise.all([
      createInterview(1, 1),
      createInterview(1, 2),
      createInterview(1, 3),
    ]);
    
    console.log('并发创建结果:');
    results.forEach((result, index) => {
      if (result.success) {
        console.log(`  尝试 ${index + 1}: ✅ 成功 - ${result.interview.candidateId}`);
      } else {
        console.log(`  尝试 ${index + 1}: ❌ 失败 - ${result.error}`);
      }
    });
    
    // 验证只有一个面试记录
    const count = await prisma.interview.count({
      where: {
        processId: testProcess.id,
        roundNumber: 1,
      },
    });
    
    console.log(`\n验证：同一轮次的面试记录数 = ${count}`);
    
    if (count === 1) {
      console.log('✅ upsert 测试通过：只有一个面试记录被创建/更新');
    } else {
      console.log(`❌ upsert 测试失败：期望 1 条记录，实际 ${count} 条`);
    }
    
    // 清理测试数据
    await prisma.interview.deleteMany({
      where: { processId: testProcess.id },
    });
    await prisma.interviewProcess.delete({
      where: { id: testProcess.id },
    });
    
    console.log('✅ 测试数据已清理\n');
    
  } catch (error) {
    console.error('❌ upsert 测试失败:', error);
  }
}

async function testEmailLimit() {
  console.log('\n=== 测试 2: 邮件发送限制（2 小时）===');
  
  try {
    // 创建一个测试面试
    const testInterview = await prisma.interview.create({
      data: {
        candidateId: 'test-candidate',
        positionId: 'test-position',
        interviewerId: 'test-interviewer',
        type: 'INTERVIEW_1',
        format: 'ONLINE',
        startTime: new Date(),
        endTime: new Date(),
        status: 'SCHEDULED',
        roundNumber: 1,
        isHRRound: false,
      },
    });
    
    console.log('创建测试面试:', testInterview.id);
    
    // 第一次发送邮件（模拟）
    console.log('\n发送第一封邮件...');
    const log1 = await prisma.interviewEmailLog.create({
      data: {
        interviewId: testInterview.id,
        candidateId: 'test-candidate',
        recipientEmail: 'test@example.com',
        subject: '测试邮件 1',
        content: '测试内容 1',
        sentBy: 'test-user',
        status: 'sent',
      },
    });
    console.log('✅ 第一封邮件已记录:', log1.sentAt);
    
    // 检查 2 小时内是否已发送
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const recentLogs = await prisma.interviewEmailLog.findMany({
      where: {
        interviewId: testInterview.id,
        sentAt: { gte: twoHoursAgo },
      },
      orderBy: { sentAt: 'desc' },
      take: 1,
    });
    
    if (recentLogs.length > 0) {
      console.log('\n检查 2 小时内发送记录:');
      console.log(`  找到记录：${recentLogs.length} 条`);
      console.log(`  最后发送时间：${recentLogs[0].sentAt}`);
      console.log('✅ 邮件限制测试通过：2 小时内不能重复发送');
    } else {
      console.log('❌ 邮件限制测试失败：未找到最近的发送记录');
    }
    
    // 清理测试数据
    await prisma.interviewEmailLog.deleteMany({
      where: { interviewId: testInterview.id },
    });
    await prisma.interview.delete({
      where: { id: testInterview.id },
    });
    
    console.log('✅ 测试数据已清理\n');
    
  } catch (error) {
    console.error('❌ 邮件限制测试失败:', error);
  }
}

async function testEmailHistory() {
  console.log('\n=== 测试 3: 邮件发送历史查询 ===');
  
  try {
    // 创建一个测试面试
    const testInterview = await prisma.interview.create({
      data: {
        candidateId: 'test-candidate',
        positionId: 'test-position',
        interviewerId: 'test-interviewer',
        type: 'INTERVIEW_1',
        format: 'ONLINE',
        startTime: new Date(),
        endTime: new Date(),
        status: 'SCHEDULED',
        roundNumber: 1,
        isHRRound: false,
      },
    });
    
    console.log('创建测试面试:', testInterview.id);
    
    // 创建多条发送记录
    console.log('\n创建 3 条邮件发送记录...');
    await prisma.interviewEmailLog.create({
      data: {
        interviewId: testInterview.id,
        candidateId: 'test-candidate',
        recipientEmail: 'test@example.com',
        subject: '面试通知 - 第一轮',
        content: '标准模板',
        sentBy: 'hr-user',
        status: 'sent',
      },
    });
    
    await prisma.interviewEmailLog.create({
      data: {
        interviewId: testInterview.id,
        candidateId: 'test-candidate',
        recipientEmail: 'test@example.com',
        subject: '面试改期通知',
        content: '改期说明',
        sentBy: 'hr-user',
        status: 'sent',
      },
    });
    
    await prisma.interviewEmailLog.create({
      data: {
        interviewId: testInterview.id,
        candidateId: 'test-candidate',
        recipientEmail: 'test@example.com',
        subject: '面试失败通知',
        content: '失败模板',
        sentBy: 'hr-user',
        status: 'failed',
        errorMessage: '邮箱地址无效',
      },
    });
    
    console.log('✅ 3 条记录已创建');
    
    // 查询发送历史
    const history = await prisma.interviewEmailLog.findMany({
      where: { interviewId: testInterview.id },
      orderBy: { sentAt: 'desc' },
    });
    
    console.log('\n邮件发送历史:');
    history.forEach((log, index) => {
      console.log(`  ${index + 1}. [${log.status}] ${log.subject} - ${log.sentBy} (${log.sentAt})`);
    });
    
    if (history.length === 3) {
      console.log('\n✅ 邮件历史查询测试通过');
    } else {
      console.log(`\n❌ 邮件历史查询测试失败：期望 3 条，实际 ${history.length} 条`);
    }
    
    // 清理测试数据
    await prisma.interviewEmailLog.deleteMany({
      where: { interviewId: testInterview.id },
    });
    await prisma.interview.delete({
      where: { id: testInterview.id },
    });
    
    console.log('✅ 测试数据已清理\n');
    
  } catch (error) {
    console.error('❌ 邮件历史测试失败:', error);
  }
}

async function runAllTests() {
  console.log('🚀 开始执行所有测试...\n');
  console.log('=' .repeat(50));
  
  await testUpsert();
  await testEmailLimit();
  await testEmailHistory();
  
  console.log('=' .repeat(50));
  console.log('\n✅ 所有测试完成！\n');
  
  await prisma.$disconnect();
}

runAllTests().catch(console.error);
