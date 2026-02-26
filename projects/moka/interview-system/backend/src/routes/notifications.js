const express = require('express');
const { responseUtils } = require('../utils/helpers');
const { authenticate, authorize } = require('../middleware/auth');
const emailService = require('../services/EmailService');
const router = express.Router();

// 所有路由需要认证
router.use(authenticate);

/**
 * @route   POST /api/notifications/test
 * @desc    发送测试邮件
 * @access  Private (Admin only)
 */
router.post('/test', authorize(['admin', 'hr']), async (req, res) => {
  try {
    const { to } = req.body;

    if (!to) {
      return responseUtils.error(res, '请提供收件人地址', 400);
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return responseUtils.error(res, '邮箱格式不正确', 400);
    }

    // 检查邮件服务是否已启用
    if (process.env.EMAIL_ENABLED !== 'true') {
      return responseUtils.error(res, '邮件服务未启用', 400);
    }

    const result = await emailService.sendTestEmail(to);

    return responseUtils.success(res, {
      messageId: result.messageId,
      to: to
    }, '测试邮件发送成功');

  } catch (error) {
    console.error('发送测试邮件错误:', error);
    return responseUtils.error(res, error.message || '发送测试邮件失败', 500);
  }
});

/**
 * @route   POST /api/notifications/interview-invitation
 * @desc    发送面试邀请邮件
 * @access  Private (Admin, HR)
 */
router.post('/interview-invitation', authorize(['admin', 'hr']), async (req, res) => {
  try {
    const {
      to,
      candidateName,
      positionTitle,
      interviewDate,
      interviewTime,
      interviewType,
      interviewerName,
      interviewerPhone,
      meetingUrl,
      location,
      notes
    } = req.body;

    // 验证必填字段
    if (!to || !candidateName || !positionTitle || !interviewDate || !interviewTime) {
      return responseUtils.error(res, '缺少必填字段', 400);
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return responseUtils.error(res, '邮箱格式不正确', 400);
    }

    // 验证面试类型
    const validTypes = ['online', 'offline', 'phone'];
    if (interviewType && !validTypes.includes(interviewType)) {
      return responseUtils.error(res, '面试类型无效', 400);
    }

    const result = await emailService.sendInterviewInvitation({
      to,
      candidateName,
      positionTitle,
      interviewDate,
      interviewTime,
      interviewType: interviewType || 'online',
      interviewerName: interviewerName || 'HR',
      interviewerPhone: interviewerPhone || '',
      meetingUrl: meetingUrl || '',
      location: location || '',
      notes: notes || '',
      companyName: process.env.COMPANY_NAME || '公司',
      companyPhone: process.env.COMPANY_PHONE || '',
      companyEmail: process.env.COMPANY_EMAIL || ''
    });

    return responseUtils.success(res, {
      messageId: result.messageId,
      to: to
    }, '面试邀请邮件发送成功');

  } catch (error) {
    console.error('发送面试邀请邮件错误:', error);
    return responseUtils.error(res, error.message || '发送面试邀请邮件失败', 500);
  }
});

/**
 * @route   POST /api/notifications/interview-reminder
 * @desc    发送面试提醒邮件
 * @access  Private (Admin, HR, Interviewer)
 */
router.post('/interview-reminder', authorize(['admin', 'hr', 'interviewer']), async (req, res) => {
  try {
    const {
      to,
      interviewerName,
      candidateName,
      positionTitle,
      interviewDate,
      interviewTime,
      round,
      meetingUrl
    } = req.body;

    // 验证必填字段
    if (!to || !interviewerName || !candidateName || !positionTitle || !interviewDate || !interviewTime) {
      return responseUtils.error(res, '缺少必填字段', 400);
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return responseUtils.error(res, '邮箱格式不正确', 400);
    }

    const result = await emailService.sendInterviewReminder({
      to,
      interviewerName,
      candidateName,
      positionTitle,
      interviewDate,
      interviewTime,
      round: round || '初试',
      meetingUrl: meetingUrl || '',
      companyName: process.env.COMPANY_NAME || '公司'
    });

    return responseUtils.success(res, {
      messageId: result.messageId,
      to: to
    }, '面试提醒邮件发送成功');

  } catch (error) {
    console.error('发送面试提醒邮件错误:', error);
    return responseUtils.error(res, error.message || '发送面试提醒邮件失败', 500);
  }
});

/**
 * @route   POST /api/notifications/feedback-request
 * @desc    发送反馈催交邮件
 * @access  Private (Admin, HR)
 */
router.post('/feedback-request', authorize(['admin', 'hr']), async (req, res) => {
  try {
    const {
      to,
      interviewerName,
      candidateName,
      positionTitle,
      interviewDate,
      interviewTime,
      overdueTime,
      feedbackUrl
    } = req.body;

    // 验证必填字段
    if (!to || !interviewerName || !candidateName || !positionTitle || !interviewDate || !overdueTime) {
      return responseUtils.error(res, '缺少必填字段', 400);
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return responseUtils.error(res, '邮箱格式不正确', 400);
    }

    const result = await emailService.sendFeedbackRequest({
      to,
      interviewerName,
      candidateName,
      positionTitle,
      interviewDate,
      interviewTime: interviewTime || '',
      overdueTime,
      feedbackUrl: feedbackUrl || '',
      companyName: process.env.COMPANY_NAME || '公司'
    });

    return responseUtils.success(res, {
      messageId: result.messageId,
      to: to
    }, '反馈催交邮件发送成功');

  } catch (error) {
    console.error('发送反馈催交邮件错误:', error);
    return responseUtils.error(res, error.message || '发送反馈催交邮件失败', 500);
  }
});

/**
 * @route   POST /api/notifications/offer
 * @desc    发送录用通知邮件
 * @access  Private (Admin, HR)
 */
router.post('/offer', authorize(['admin', 'hr']), async (req, res) => {
  try {
    const {
      to,
      candidateName,
      positionTitle,
      department,
      startDate,
      location,
      salaryMin,
      salaryMax,
      replyDeadline
    } = req.body;

    // 验证必填字段
    if (!to || !candidateName || !positionTitle || !department || !startDate || !replyDeadline) {
      return responseUtils.error(res, '缺少必填字段', 400);
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return responseUtils.error(res, '邮箱格式不正确', 400);
    }

    const result = await emailService.sendOffer({
      to,
      candidateName,
      positionTitle,
      department,
      startDate,
      location: location || '',
      salaryMin: salaryMin || '',
      salaryMax: salaryMax || '',
      replyDeadline,
      companyName: process.env.COMPANY_NAME || '公司',
      companyPhone: process.env.COMPANY_PHONE || ''
    });

    return responseUtils.success(res, {
      messageId: result.messageId,
      to: to
    }, '录用通知邮件发送成功');

  } catch (error) {
    console.error('发送录用通知邮件错误:', error);
    return responseUtils.error(res, error.message || '发送录用通知邮件失败', 500);
  }
});

/**
 * @route   POST /api/notifications/bulk
 * @desc    批量发送邮件
 * @access  Private (Admin, HR)
 */
router.post('/bulk', authorize(['admin', 'hr']), async (req, res) => {
  try {
    const { templateName, recipients, commonData } = req.body;

    // 验证必填字段
    if (!templateName || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return responseUtils.error(res, '缺少必填字段或收件人列表为空', 400);
    }

    // 验证模板类型
    const validTemplates = ['interview_invitation', 'interview_reminder', 'feedback_request'];
    if (!validTemplates.includes(templateName)) {
      return responseUtils.error(res, '无效的邮件模板', 400);
    }

    // 验证收件人邮箱
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const recipient of recipients) {
      if (!recipient.to || !emailRegex.test(recipient.to)) {
        return responseUtils.error(res, `收件人邮箱格式不正确: ${recipient.to}`, 400);
      }
    }

    // 限制批量发送数量
    if (recipients.length > 50) {
      return responseUtils.error(res, '单次批量发送不能超过50封邮件', 400);
    }

    const results = await emailService.sendBulkEmails(recipients, templateName, commonData || {});

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return responseUtils.success(res, {
      total: results.length,
      success: successCount,
      failed: failCount,
      results
    }, `批量发送完成，成功 ${successCount} 封，失败 ${failCount} 封`);

  } catch (error) {
    console.error('批量发送邮件错误:', error);
    return responseUtils.error(res, error.message || '批量发送邮件失败', 500);
  }
});

/**
 * @route   GET /api/notifications/config
 * @desc    获取邮件服务配置
 * @access  Private (Admin only)
 */
router.get('/config', authorize(['admin']), async (req, res) => {
  try {
    const config = {
      enabled: process.env.EMAIL_ENABLED === 'true',
      host: process.env.EMAIL_HOST || 'smtp.qq.com',
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      companyName: process.env.COMPANY_NAME || '',
      companyPhone: process.env.COMPANY_PHONE || '',
      companyEmail: process.env.COMPANY_EMAIL || ''
    };

    // 不返回敏感信息
    return responseUtils.success(res, config, '获取邮件配置成功');

  } catch (error) {
    console.error('获取邮件配置错误:', error);
    return responseUtils.error(res, '获取邮件配置失败', 500);
  }
});

/**
 * @route   PUT /api/notifications/config
 * @desc    更新邮件服务配置（仅限开发环境）
 * @access  Private (Admin only)
 */
router.put('/config', authorize(['admin']), async (req, res) => {
  try {
    // 仅在开发环境允许更新配置
    if (process.env.NODE_ENV === 'production') {
      return responseUtils.error(res, '生产环境不允许通过API更新配置', 403);
    }

    const {
      EMAIL_HOST,
      EMAIL_PORT,
      EMAIL_SECURE,
      EMAIL_FROM,
      COMPANY_NAME,
      COMPANY_PHONE,
      COMPANY_EMAIL
    } = req.body;

    // 更新环境变量（仅在当前进程有效）
    if (EMAIL_HOST) process.env.EMAIL_HOST = EMAIL_HOST;
    if (EMAIL_PORT) process.env.EMAIL_PORT = EMAIL_PORT;
    if (EMAIL_SECURE !== undefined) process.env.EMAIL_SECURE = EMAIL_SECURE;
    if (EMAIL_FROM) process.env.EMAIL_FROM = EMAIL_FROM;
    if (COMPANY_NAME) process.env.COMPANY_NAME = COMPANY_NAME;
    if (COMPANY_PHONE) process.env.COMPANY_PHONE = COMPANY_PHONE;
    if (COMPANY_EMAIL) process.env.COMPANY_EMAIL = COMPANY_EMAIL;

    // 重新初始化邮件服务
    emailService.initialized = false;
    emailService.initialize();

    return responseUtils.success(res, null, '邮件配置更新成功');

  } catch (error) {
    console.error('更新邮件配置错误:', error);
    return responseUtils.error(res, '更新邮件配置失败', 500);
  }
});

module.exports = router;
