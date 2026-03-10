const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

/**
 * 邮件模板管理
 */
class EmailTemplate {
  constructor() {
    this.templates = new Map();
    this.loadTemplates();
  }

  /**
   * 加载邮件模板
   */
  loadTemplates() {
    this.templates.set('interview_invitation', {
      subject: '面试邀请 - {{companyName}}',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>面试邀请</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 10px; }
    .info-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea; }
    .footer { text-align: center; color: #666; font-size: 14px; margin-top: 20px; }
    .btn { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    .highlight { font-weight: bold; color: #667eea; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 面试邀请</h1>
    </div>
    <div class="content">
      <p>尊敬的 <span class="highlight">{{candidateName}}</span>：</p>
      <p>感谢您对我们 <span class="highlight">{{positionTitle}}</span> 职位的关注。我们很高兴通知您，经过初步筛选，我们邀请您参加面试。</p>

      <div class="info-box">
        <h3>📋 面试信息</h3>
        <p><strong>职位：</strong>{{positionTitle}}</p>
        <p><strong>时间：</strong>{{interviewDate}} {{interviewTime}}</p>
        <p><strong>方式：</strong>{{interviewType}}</p>
        {{#if meetingUrl}}
        <p><strong>会议链接：</strong><a href="{{meetingUrl}}">点击加入会议</a></p>
        {{/if}}
        {{#if location}}
        <p><strong>地址：</strong>{{location}}</p>
        {{/if}}
        <p><strong>面试官：</strong>{{interviewerName}}</p>
        <p><strong>联系电话：</strong>{{interviewerPhone}}</p>
      </div>

      {{#if notes}}
      <div class="info-box">
        <h3>📝 备注</h3>
        <p>{{notes}}</p>
      </div>
      {{/if}}

      <p style="text-align: center;">
        如有任何问题，请随时联系我们。
      </p>

      <div class="footer">
        <p>{{companyName}} 招聘团队</p>
        <p>联系电话：{{companyPhone}}</p>
        <p>邮箱：{{companyEmail}}</p>
      </div>
    </div>
  </div>
</body>
</html>
      `
    });

    this.templates.set('interview_reminder', {
      subject: '面试提醒 - {{companyName}}',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>面试提醒</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 10px; }
    .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
    .info-box { background: white; padding: 20px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 14px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ 面试提醒</h1>
    </div>
    <div class="content">
      <p>尊敬的 <span class="highlight">{{interviewerName}}</span>：</p>

      <div class="alert">
        <strong>📅 温馨提醒：</strong>您有一场面试即将开始！
      </div>

      <div class="info-box">
        <h3>面试详情</h3>
        <p><strong>候选人：</strong>{{candidateName}}</p>
        <p><strong>职位：</strong>{{positionTitle}}</p>
        <p><strong>时间：</strong>{{interviewDate}} {{interviewTime}}</p>
        <p><strong>轮次：</strong>{{round}}</p>
        {{#if meetingUrl}}
        <p><strong>会议链接：</strong><a href="{{meetingUrl}}">{{meetingUrl}}</a></p>
        {{/if}}
      </div>

      <p style="text-align: center;">
        请准时参加面试，并提前做好准备工作。
      </p>

      <div class="footer">
        <p>祝面试顺利！</p>
      </div>
    </div>
  </div>
</body>
</html>
      `
    });

    this.templates.set('feedback_request', {
      subject: '面试反馈催交 - {{companyName}}',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>面试反馈催交</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 10px; }
    .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 14px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📝 面试反馈催交</h1>
    </div>
    <div class="content">
      <p>尊敬的 <span class="highlight">{{interviewerName}}</span>：</p>

      <div class="alert">
        <strong>⏰ 逾期提醒：</strong>您有一场面试的反馈还未提交。
      </div>

      <div class="info-box">
        <h3>面试信息</h3>
        <p><strong>候选人：</strong>{{candidateName}}</p>
        <p><strong>职位：</strong>{{positionTitle}}</p>
        <p><strong>面试时间：</strong>{{interviewDate}} {{interviewTime}}</p>
        <p><strong>逾期时长：</strong>{{overdueTime}}</p>
      </div>

      <p>请尽快登录系统提交面试反馈，以便我们及时跟进招聘流程。</p>

      <div style="text-align: center; margin-top: 30px;">
        <a href="{{feedbackUrl}}" style="display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px;">
          提交反馈
        </a>
      </div>

      <div class="footer">
        <p>如有任何问题，请联系HR部门。</p>
      </div>
    </div>
  </div>
</body>
</html>
      `
    });

    this.templates.set('offer_sent', {
      subject: '录用通知 - {{companyName}}',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>录用通知</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #56ab2f 0%, #a8edea 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 10px; }
    .offer { background: white; padding: 30px; margin: 20px 0; border: 2px solid #56ab2f; border-radius: 10px; }
    .footer { text-align: center; color: #666; font-size: 14px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 录用通知</h1>
    </div>
    <div class="content">
      <p>尊敬的 <span class="highlight">{{candidateName}}</span>：</p>
      <p>恭喜您！经过我们团队的认真评估和讨论，我们很高兴地通知您，您已成功获得 <span class="highlight">{{positionTitle}}</span> 职位的录用机会！</p>

      <div class="offer">
        <h3>📋 录用详情</h3>
        <p><strong>职位：</strong>{{positionTitle}}</p>
        <p><strong>部门：</strong>{{department}}</p>
        <p><strong>入职时间：</strong>{{startDate}}</p>
        <p><strong>工作地点：</strong>{{location}}</p>
        {{#if salaryMin}}
        <p><strong>薪资范围：</strong>¥{{salaryMin}} - ¥{{salaryMax}}</p>
        {{/if}}
      </div>

      <p>我们期待您的加入，相信您的能力和经验会为团队带来新的活力！</p>

      <div class="footer">
        <p>请于 <span class="highlight">{{replyDeadline}}</span> 前回复确认是否接受此录用通知。</p>
        <p>{{companyName}} 人力资源部</p>
        <p>联系电话：{{companyPhone}}</p>
      </div>
    </div>
  </div>
</body>
</html>
      `
    });

    this.templates.set('password_reset', {
      subject: '密码重置请求 - 面试管理系统',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>密码重置</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 10px; }
    .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 14px; margin-top: 20px; }
    .btn { display: inline-block; padding: 12px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 密码重置请求</h1>
    </div>
    <div class="content">
      <p>您好 <strong>{{username}}</strong>，</p>
      <p>我们收到了您的密码重置请求。如果这是您发起的操作，请点击下面的按钮重置密码：</p>

      <div style="text-align: center;">
        <a href="{{resetUrl}}" class="btn">重置密码</a>
      </div>

      <p style="text-align: center; margin: 20px 0;">或者复制以下链接到浏览器：</p>
      <p style="background: #eee; padding: 10px; word-break: break-all; font-size: 12px;">{{resetUrl}}</p>

      <div class="alert">
        <p><strong>⚠️ 重要提示：</strong></p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>此链接将在 <strong>{{expiresIn}}</strong> 后失效</li>
          <li>如果您没有发起密码重置请求，请忽略此邮件</li>
          <li>请勿将此链接分享给任何人</li>
        </ul>
      </div>

      <div class="footer">
        <p>面试管理系统</p>
        <p>这是一封自动发送的邮件，请勿直接回复</p>
      </div>
    </div>
  </div>
</body>
</html>
      `
    });
  }

  /**
   * 获取模板
   */
  getTemplate(templateName) {
    return this.templates.get(templateName);
  }

  /**
   * 添加自定义模板
   */
  addTemplate(name, template) {
    this.templates.set(name, template);
  }
}

/**
 * 邮件服务
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.templateManager = new EmailTemplate();
    this.initialized = false;
  }

  /**
   * 初始化邮件服务
   */
  initialize() {
    if (this.initialized) {
      return;
    }

    const config = {
      host: process.env.EMAIL_HOST || 'smtp.qq.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true', // SSL on 465
      requireTLS: process.env.EMAIL_PORT === '587', // STARTTLS on 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false // 开发环境可禁用证书验证
      }
    };

    this.transporter = nodemailer.createTransport(config);

    // 验证配置
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('邮件服务配置错误:', error);
        this.initialized = false;
      } else {
        console.log('✓ 邮件服务初始化成功');
        this.initialized = true;
      }
    });
  }

  /**
   * 渲染模板
   */
  renderTemplate(templateName, data) {
    const template = this.templateManager.getTemplate(templateName);
    if (!template) {
      throw new Error(`模板 ${templateName} 不存在`);
    }

    let html = template.html;

    // 替换变量
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, data[key]);
    });

    // 处理条件块 {{#if}}...{{/if}}
    html = html.replace(/{{#if\s+([^}]+)}}([\s\S]*?){{\/if}}/g, (match, condition, content) => {
      const value = data[condition.trim()];
      return value ? content : '';
    });

    return {
      subject: template.subject,
      html: html
    };
  }

  /**
   * 发送邮件
   */
  async sendEmail(to, subject, html, text = '', attachments = []) {
    if (!this.initialized) {
      this.initialize();
    }

    if (!this.initialized) {
      throw new Error('邮件服务未正确初始化');
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''),
        attachments
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('邮件发送成功:', info.messageId);

      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      console.error('邮件发送失败:', error);
      throw error;
    }
  }

  /**
   * 发送面试邀请邮件
   */
  async sendInterviewInvitation(data) {
    const { to, candidateName, positionTitle, interviewDate, interviewTime, interviewType, interviewerName, interviewerPhone, meetingUrl, location, notes, companyName, companyPhone, companyEmail } = data;

    const { subject, html } = this.renderTemplate('interview_invitation', {
      candidateName,
      positionTitle,
      interviewDate,
      interviewTime,
      interviewType,
      meetingUrl: meetingUrl || '',
      location: location || '',
      interviewerName,
      interviewerPhone,
      notes: notes || '',
      companyName: companyName || process.env.COMPANY_NAME || '公司',
      companyPhone: companyPhone || '',
      companyEmail: companyEmail || ''
    });

    return await this.sendEmail(to, subject, html);
  }

  /**
   * 发送面试提醒邮件
   */
  async sendInterviewReminder(data) {
    const { to, interviewerName, candidateName, positionTitle, interviewDate, interviewTime, round, meetingUrl, companyName } = data;

    const { subject, html } = this.renderTemplate('interview_reminder', {
      interviewerName,
      candidateName,
      positionTitle,
      interviewDate,
      interviewTime,
      round,
      meetingUrl: meetingUrl || '',
      companyName: companyName || process.env.COMPANY_NAME || '公司'
    });

    return await this.sendEmail(to, subject, html);
  }

  /**
   * 发送反馈催交邮件
   */
  async sendFeedbackRequest(data) {
    const { to, interviewerName, candidateName, positionTitle, interviewDate, interviewTime, overdueTime, feedbackUrl, companyName } = data;

    const { subject, html } = this.renderTemplate('feedback_request', {
      interviewerName,
      candidateName,
      positionTitle,
      interviewDate,
      interviewTime,
      overdueTime,
      feedbackUrl: feedbackUrl || '',
      companyName: companyName || process.env.COMPANY_NAME || '公司'
    });

    return await this.sendEmail(to, subject, html);
  }

  /**
   * 发送录用通知邮件
   */
  async sendOffer(data) {
    const { to, candidateName, positionTitle, department, startDate, location, salaryMin, salaryMax, replyDeadline, companyName, companyPhone } = data;

    const { subject, html } = this.renderTemplate('offer_sent', {
      candidateName,
      positionTitle,
      department,
      startDate,
      location,
      salaryMin: salaryMin ? String(salaryMin) : '',
      salaryMax: salaryMax ? String(salaryMax) : '',
      replyDeadline,
      companyName: companyName || process.env.COMPANY_NAME || '公司',
      companyPhone: companyPhone || ''
    });

    return await this.sendEmail(to, subject, html);
  }

  /**
   * 发送测试邮件
   */
  async sendTestEmail(to) {
    const subject = '邮件服务测试';
    const html = `
      <html>
        <body>
          <h1>邮件服务测试</h1>
          <p>如果您收到此邮件，说明邮件服务配置正确！</p>
          <p>发送时间: ${new Date().toLocaleString('zh-CN')}</p>
        </body>
      </html>
    `;

    return await this.sendEmail(to, subject, html);
  }

  /**
   * 发送密码重置邮件
   */
  async sendPasswordResetEmail(to, data) {
    const { username, resetUrl, expiresIn } = data;

    const { subject, html } = this.renderTemplate('password_reset', {
      username,
      resetUrl,
      expiresIn
    });

    return await this.sendEmail(to, subject, html);
  }

  /**
   * 批量发送邮件
   */
  async sendBulkEmails(recipients, templateName, dataMap) {
    const results = [];

    for (const recipient of recipients) {
      try {
        const data = { ...dataMap, ...recipient };

        let emailResult;
        switch (templateName) {
          case 'interview_invitation':
            emailResult = await this.sendInterviewInvitation(data);
            break;
          case 'interview_reminder':
            emailResult = await this.sendInterviewReminder(data);
            break;
          case 'feedback_request':
            emailResult = await this.sendFeedbackRequest(data);
            break;
          default:
            throw new Error(`未知模板: ${templateName}`);
        }

        results.push({
          to: recipient.to || recipient.email,
          success: true,
          messageId: emailResult.messageId
        });

        // 避免发送过快
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`发送给 ${recipient.to || recipient.email} 失败:`, error);
        results.push({
          to: recipient.to || recipient.email,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }
}

// 创建单例
const emailService = new EmailService();

// 自动初始化
if (process.env.EMAIL_ENABLED === 'true') {
  emailService.initialize();
}

module.exports = emailService;
