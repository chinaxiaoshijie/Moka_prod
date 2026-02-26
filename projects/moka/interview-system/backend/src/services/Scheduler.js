/**
 * 定时任务调度器
 * 负责面试自动提醒、反馈催交等定时任务
 */

const cron = require('node-cron');
const { query } = require('../config/database');
const emailService = require('./EmailService');

class Scheduler {
  constructor() {
    this.jobs = new Map();
    this.isInitialized = false;
  }

  /**
   * 初始化调度器
   */
  initialize() {
    if (this.isInitialized) {
      console.log('⏰ 调度器已经初始化');
      return;
    }

    console.log('⏰ 正在初始化定时任务调度器...');

    // 每小时检查一次面试提醒（面试前1小时）
    this.scheduleHourlyReminder();

    // 每天早上9点检查面试提醒（面试前24小时）
    this.scheduleDailyReminder();

    // 每天早上10点检查反馈逾期
    this.scheduleFeedbackOverdueCheck();

    this.isInitialized = true;
    console.log('✅ 定时任务调度器初始化成功');
    this.listJobs();
  }

  /**
   * 面试前1小时提醒
   */
  scheduleHourlyReminder() {
    const job = cron.schedule('0 * * * *', async () => {
      try {
        console.log('⏰ [定时任务] 检查面试前1小时提醒...');
        await this.sendInterviewReminders(1);
      } catch (error) {
        console.error('❌ [定时任务] 面试前1小时提醒失败:', error.message);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Shanghai'
    });

    this.jobs.set('hourly-reminder', job);
    job.start();
    console.log('  ✓ 已注册: 面试前1小时提醒 (每小时执行)');
  }

  /**
   * 面试前24小时提醒（每天早上9点）
   */
  scheduleDailyReminder() {
    const job = cron.schedule('0 9 * * *', async () => {
      try {
        console.log('⏰ [定时任务] 检查面试前24小时提醒...');
        await this.sendInterviewReminders(24);
      } catch (error) {
        console.error('❌ [定时任务] 面试前24小时提醒失败:', error.message);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Shanghai'
    });

    this.jobs.set('daily-reminder', job);
    job.start();
    console.log('  ✓ 已注册: 面试前24小时提醒 (每天9:00执行)');
  }

  /**
   * 反馈逾期检查（每天早上10点）
   */
  scheduleFeedbackOverdueCheck() {
    const job = cron.schedule('0 10 * * *', async () => {
      try {
        console.log('⏰ [定时任务] 检查反馈逾期...');
        await this.checkFeedbackOverdue();
      } catch (error) {
        console.error('❌ [定时任务] 反馈逾期检查失败:', error.message);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Shanghai'
    });

    this.jobs.set('feedback-overdue', job);
    job.start();
    console.log('  ✓ 已注册: 反馈逾期检查 (每天10:00执行)');
  }

  /**
   * 发送面试提醒
   * @param {number} hoursBefore - 提前小时数
   */
  async sendInterviewReminders(hoursBefore) {
    const now = new Date();
    const startTime = new Date(now.getTime() + hoursBefore * 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1小时窗口

    const sql = `
      SELECT
        i.id,
        i.interview_date,
        i.interview_time,
        i.interview_type,
        i.meeting_url,
        i.location,
        i.status,
        c.name as candidate_name,
        c.email as candidate_email,
        c.phone as candidate_phone,
        p.title as position_title,
        u.name as interviewer_name,
        u.email as interviewer_email,
        u.phone as interviewer_phone
      FROM interviews i
      LEFT JOIN candidates c ON i.candidate_id = c.id
      LEFT JOIN positions p ON i.position_id = p.id
      LEFT JOIN users u ON i.interviewer_id = u.id
      WHERE i.status IN ('scheduled', 'confirmed')
        AND i.interview_date >= ?
        AND i.interview_date < ?
        AND i.reminder_sent IS NULL
      ORDER BY i.interview_date, i.interview_time
    `;

    const interviews = await query(sql, [
      startTime.toISOString().slice(0, 19).replace('T', ' '),
      endTime.toISOString().slice(0, 19).replace('T', ' ')
    ]);

    if (interviews.length === 0) {
      console.log(`  ℹ️  没有${hoursBefore}小时内的面试需要提醒`);
      return;
    }

    console.log(`  📧 找到 ${interviews.length} 场面试需要提醒`);

    let successCount = 0;
    for (const interview of interviews) {
      try {
        // 格式化面试日期时间
        const interviewDate = new Date(interview.interview_date);
        const dateStr = interviewDate.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        const timeStr = interview.interview_time || interviewDate.toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit'
        });

        // 发送给面试官
        if (interview.interviewer_email) {
          await emailService.sendInterviewReminder({
            to: interview.interviewer_email,
            interviewerName: interview.interviewer_name,
            candidateName: interview.candidate_name,
            positionTitle: interview.position_title,
            interviewDate: dateStr,
            interviewTime: timeStr
          });
          console.log(`    ✓ 已发送提醒给面试官: ${interview.interviewer_name} (${interview.interviewer_email})`);
        }

        // 发送给候选人（面试前24小时）
        if (hoursBefore >= 24 && interview.candidate_email) {
          await emailService.sendInterviewReminder({
            to: interview.candidate_email,
            interviewerName: interview.candidate_name,
            candidateName: interview.candidate_name,
            positionTitle: interview.position_title,
            interviewDate: dateStr,
            interviewTime: timeStr
          });
          console.log(`    ✓ 已发送提醒给候选人: ${interview.candidate_name} (${interview.candidate_email})`);
        }

        // 标记已发送提醒
        await query(
          'UPDATE interviews SET reminder_sent = NOW() WHERE id = ?',
          [interview.id]
        );

        successCount++;
      } catch (error) {
        console.error(`    ✗ 面试 ${interview.id} 提醒发送失败:`, error.message);
      }
    }

    console.log(`  ✅ ${hoursBefore}小时提醒完成: ${successCount}/${interviews.length} 成功`);
  }

  /**
   * 检查反馈逾期
   */
  async checkFeedbackOverdue() {
    // 面试结束超过2天且未提交反馈的
    const sql = `
      SELECT
        i.id,
        i.interview_date,
        c.name as candidate_name,
        p.title as position_title,
        u.name as interviewer_name,
        u.email as interviewer_email,
        DATEDIFF(NOW(), i.interview_date) as overdue_days
      FROM interviews i
      LEFT JOIN candidates c ON i.candidate_id = c.id
      LEFT JOIN positions p ON i.position_id = p.id
      LEFT JOIN users u ON i.interviewer_id = u.id
      WHERE i.status = 'completed'
        AND i.feedback_status = 'pending'
        AND DATEDIFF(NOW(), i.interview_date) >= 2
        AND (i.feedback_reminder_sent IS NULL OR DATEDIFF(NOW(), i.feedback_reminder_sent) >= 7)
      ORDER BY i.interview_date DESC
    `;

    const interviews = await query(sql);

    if (interviews.length === 0) {
      console.log('  ℹ️  没有逾期的反馈需要催交');
      return;
    }

    console.log(`  📧 找到 ${interviews.length} 场面试反馈逾期`);

    let successCount = 0;
    for (const interview of interviews) {
      try {
        await emailService.sendFeedbackRequest({
          to: interview.interviewer_email,
          interviewerName: interview.interviewer_name,
          candidateName: interview.candidate_name,
          positionTitle: interview.position_title,
          interviewDate: new Date(interview.interview_date).toLocaleDateString('zh-CN'),
          overdueTime: `${interview.overdue_days}天`
        });

        // 更新催交时间
        await query(
          'UPDATE interviews SET feedback_reminder_sent = NOW() WHERE id = ?',
          [interview.id]
        );

        console.log(`    ✓ 已发送催交提醒: ${interview.interviewer_name} (${interview.interviewer_email})`);
        successCount++;
      } catch (error) {
        console.error(`    ✗ 面试 ${interview.id} 催交失败:`, error.message);
      }
    }

    console.log(`  ✅ 反馈催交完成: ${successCount}/${interviews.length} 成功`);
  }

  /**
   * 列出所有已注册的任务
   */
  listJobs() {
    console.log('\n  📋 已注册的定时任务:');
    for (const [name, job] of this.jobs.entries()) {
      const status = job.running ? '运行中' : '已停止';
      console.log(`    • ${name}: ${status}`);
    }
    console.log('');
  }

  /**
   * 停止所有任务
   */
  stopAll() {
    console.log('⏰ 正在停止所有定时任务...');
    for (const [name, job] of this.jobs.entries()) {
      job.stop();
      console.log(`  ✓ 已停止: ${name}`);
    }
    this.jobs.clear();
    this.isInitialized = false;
    console.log('✅ 所有定时任务已停止');
  }

  /**
   * 手动触发特定任务（用于测试）
   */
  async triggerJob(jobName) {
    console.log(`⏰ 手动触发任务: ${jobName}`);

    switch (jobName) {
      case 'hourly-reminder':
        await this.sendInterviewReminders(1);
        break;
      case 'daily-reminder':
        await this.sendInterviewReminders(24);
        break;
      case 'feedback-overdue':
        await this.checkFeedbackOverdue();
        break;
      default:
        console.log(`❌ 未知的任务名称: ${jobName}`);
    }
  }
}

// 创建单例
const scheduler = new Scheduler();

module.exports = scheduler;
