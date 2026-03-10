require('dotenv').config();
const emailService = require('./src/services/EmailService');

console.log('📧 测试面试邀请邮件\n');

async function testInterviewInvitation() {
  emailService.initialize();

  setTimeout(async () => {
    try {
      const result = await emailService.sendInterviewInvitation({
        to: '37895149@qq.com',
        candidateName: '张三',
        positionTitle: '前端工程师',
        interviewDate: '2026年3月1日',
        interviewTime: '14:00',
        interviewType: 'online',
        meetingUrl: 'https://meeting.feishu.cn/123456',
        interviewerName: '李面试官',
        interviewerPhone: '13800138000',
        notes: '请提前5分钟加入会议',
        companyName: 'Malong科技',
        companyPhone: '400-123-4567',
        companyEmail: 'shaxiao@malong.com'
      });

      console.log('✅ 面试邀请邮件发送成功!');
      console.log('📧 Message ID:', result.messageId);
      console.log('');
      console.log('📥 请检查邮箱: 37895149@qq.com');
      console.log('   邮件主题: 面试邀请 - Malong科技');

      process.exit(0);
    } catch (error) {
      console.error('❌ 发送失败:', error.message);
      process.exit(1);
    }
  }, 2000);
}

testInterviewInvitation();
