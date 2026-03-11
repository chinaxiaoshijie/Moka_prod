import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import { Transporter } from "nodemailer";

interface InterviewEmailData {
  candidateName: string;
  candidateEmail: string;
  positionTitle: string;
  interviewerName: string;
  interviewerEmail: string;
  startTime: Date;
  endTime: Date;
  format: string;
  location?: string;
  meetingUrl?: string;
  meetingNumber?: string;
}

interface FeedbackEmailData {
  interviewerName: string;
  interviewerEmail: string;
  candidateName: string;
  positionTitle: string;
  interviewType: string;
  interviewId: string;
  feedbackUrl: string;
}

interface MentionEmailData {
  interviewerName: string;
  interviewerEmail: string;
  candidateName: string;
  positionTitle?: string;
  mentionedByName: string;
  message?: string;
  candidateId: string;
}

interface ProcessCompletedData {
  hrEmail: string;
  hrName?: string;
  candidateName: string;
  positionTitle?: string;
  result?: string;
  totalRounds?: number;
  finalResult?: string;
}

interface RoundCompletedData {
  hrEmail: string;
  hrName?: string;
  candidateName: string;
  positionTitle?: string;
  roundNumber?: number;
  roundType?: string;
  result?: string;
  interviewerName?: string;
}

@Injectable()
export class EmailService {
  private transporter: Transporter | null = null;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const smtpHost = this.configService.get("SMTP_HOST");
    const smtpPort = this.configService.get("SMTP_PORT");
    const smtpUser = this.configService.get("SMTP_USER");
    const smtpPass = this.configService.get("SMTP_PASS");

    if (smtpHost && smtpPort && smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort, 10),
        secure: parseInt(smtpPort, 10) === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      console.log("[EmailService] SMTP transporter initialized");
    } else {
      console.log(
        "[EmailService] SMTP not configured, using console logging mode",
      );
    }
  }

  private async sendEmail(
    to: string,
    subject: string,
    html: string,
    text: string,
  ): Promise<void> {
    const from = this.configService.get("SMTP_FROM") || "noreply@moka.com";

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from,
          to,
          subject,
          text,
          html,
        });
        console.log(`[EmailService] Email sent to ${to}`);
      } catch (error) {
        console.error(`[EmailService] Failed to send email to ${to}:`, error);
        throw error;
      }
    } else {
      console.log(`[EmailService] CONSOLE MODE - Would send email to: ${to}`);
      console.log(`[EmailService] Subject: ${subject}`);
      console.log(`[EmailService] Body: ${text}`);
    }
  }

  async sendInterviewNotificationToCandidate(
    data: InterviewEmailData,
  ): Promise<void> {
    const subject = `面试通知 - ${data.positionTitle}`;
    const { text, html } = this.buildCandidateEmail(data);

    await this.sendEmail(data.candidateEmail, subject, html, text);
  }

  async sendInterviewNotificationToInterviewer(
    data: InterviewEmailData,
  ): Promise<void> {
    const subject = `面试安排 - ${data.candidateName} - ${data.positionTitle}`;
    const { text, html } = this.buildInterviewerEmail(data);

    await this.sendEmail(data.interviewerEmail, subject, html, text);
  }

  async sendFeedbackReminder(data: FeedbackEmailData): Promise<void> {
    const subject = `请填写面试反馈 - ${data.candidateName}`;
    const { text, html } = this.buildFeedbackReminderEmail(data);

    await this.sendEmail(data.interviewerEmail, subject, html, text);
  }

  async sendMentionNotification(data: MentionEmailData): Promise<void> {
    const subject = `您被@查看候选人简历 - ${data.candidateName}`;
    const { text, html } = this.buildMentionEmail(data);

    await this.sendEmail(data.interviewerEmail, subject, html, text);
  }

  async sendProcessCompletedToHR(data: ProcessCompletedData): Promise<void> {
    const subject = `面试流程已完成 - ${data.candidateName} - ${data.positionTitle}`;
    const { text, html } = this.buildProcessCompletedEmail(data);

    await this.sendEmail(data.hrEmail, subject, html, text);
  }

  async sendRoundCompletedToHR(data: RoundCompletedData): Promise<void> {
    const subject = `面试轮次完成 - ${data.candidateName} - ${data.positionTitle} 第${data.roundNumber}轮`;
    const { text, html } = this.buildRoundCompletedEmail(data);

    await this.sendEmail(data.hrEmail, subject, html, text);
  }

  private buildCandidateEmail(data: InterviewEmailData): {
    text: string;
    html: string;
  } {
    const formatText = data.format === "ONLINE" ? "线上视频面试" : "线下面试";
    const locationInfo =
      data.format === "ONLINE"
        ? `会议链接：${data.meetingUrl || "待定"}\n会议号：${data.meetingNumber || "待定"}`
        : `面试地点：${data.location || "待定"}`;

    const text = `
尊敬的 ${data.candidateName} 您好：

感谢您应聘我司 ${data.positionTitle} 职位。经过初步筛选，我们诚挚邀请您参加面试：

面试信息：
- 职位：${data.positionTitle}
- 时间：${this.formatDateTime(data.startTime)} - ${this.formatTime(data.endTime)}
- 形式：${formatText}
- ${locationInfo}
- 面试官：${data.interviewerName}

请您准时参加。如有任何问题，请随时与我们联系。

祝您面试顺利！

Moka 面试系统
    `.trim();

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">面试通知</h2>
  <p>尊敬的 <strong>${data.candidateName}</strong> 您好：</p>
  <p>感谢您应聘我司 <strong>${data.positionTitle}</strong> 职位。经过初步筛选，我们诚挚邀请您参加面试：</p>
  
  <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #666;">面试信息</h3>
    <p><strong>职位：</strong>${data.positionTitle}</p>
    <p><strong>时间：</strong>${this.formatDateTime(data.startTime)} - ${this.formatTime(data.endTime)}</p>
    <p><strong>形式：</strong>${formatText}</p>
    <p><strong>${data.format === "ONLINE" ? "会议链接" : "面试地点"}：</strong>${data.format === "ONLINE" ? data.meetingUrl : data.location}</p>
    <p><strong>面试官：</strong>${data.interviewerName}</p>
  </div>
  
  <p>请您准时参加。如有任何问题，请随时与我们联系。</p>
  <p>祝您面试顺利！</p>
  <p style="color: #999; margin-top: 30px;">Moka 面试系统</p>
</div>
    `.trim();

    return { text, html };
  }

  private buildInterviewerEmail(data: InterviewEmailData): {
    text: string;
    html: string;
  } {
    const formatText = data.format === "ONLINE" ? "线上视频面试" : "线下面试";
    const locationInfo =
      data.format === "ONLINE"
        ? `会议链接：${data.meetingUrl || "待定"}`
        : `面试地点：${data.location || "待定"}`;

    const text = `
${data.interviewerName} 您好：

您有新的面试安排：

候选人信息：
- 姓名：${data.candidateName}
- 应聘职位：${data.positionTitle}

面试详情：
- 时间：${this.formatDateTime(data.startTime)} - ${this.formatTime(data.endTime)}
- 形式：${formatText}
- ${locationInfo}

请在面试结束后及时填写面试反馈。

Moka 面试系统
    `.trim();

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">面试安排通知</h2>
  <p>${data.interviewerName} 您好：</p>
  <p>您有新的面试安排：</p>
  
  <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #666;">候选人信息</h3>
    <p><strong>姓名：</strong>${data.candidateName}</p>
    <p><strong>应聘职位：</strong>${data.positionTitle}</p>
  </div>
  
  <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #666;">面试详情</h3>
    <p><strong>时间：</strong>${this.formatDateTime(data.startTime)} - ${this.formatTime(data.endTime)}</p>
    <p><strong>形式：</strong>${formatText}</p>
    <p><strong>${data.format === "ONLINE" ? "会议链接" : "面试地点"}：</strong>${data.format === "ONLINE" ? data.meetingUrl : data.location}</p>
  </div>
  
  <p>请在面试结束后及时填写面试反馈。</p>
  <p style="color: #999; margin-top: 30px;">Moka 面试系统</p>
</div>
    `.trim();

    return { text, html };
  }

  private buildFeedbackReminderEmail(data: FeedbackEmailData): {
    text: string;
    html: string;
  } {
    const typeText =
      data.interviewType === "INTERVIEW_1"
        ? "初试"
        : data.interviewType === "INTERVIEW_2"
          ? "复试"
          : "终试";

    const text = `
${data.interviewerName} 您好：

您刚刚完成了对 ${data.candidateName}（${data.positionTitle}）的${typeText}。

请尽快填写面试反馈：
${data.feedbackUrl}

您的反馈对招聘决策非常重要，感谢您的配合！

Moka 面试系统
    `.trim();

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">面试反馈提醒</h2>
  <p>${data.interviewerName} 您好：</p>
  <p>您刚刚完成了对 <strong>${data.candidateName}</strong>（${data.positionTitle}）的${typeText}。</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="${data.feedbackUrl}" style="background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">填写面试反馈</a>
  </div>
  
  <p>或复制以下链接到浏览器打开：</p>
  <p style="background: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all;">${data.feedbackUrl}</p>
  
  <p>您的反馈对招聘决策非常重要，感谢您的配合！</p>
  <p style="color: #999; margin-top: 30px;">Moka 面试系统</p>
</div>
    `.trim();

    return { text, html };
  }

  private buildMentionEmail(data: MentionEmailData): {
    text: string;
    html: string;
  } {
    const candidateUrl = `${this.configService.get("FRONTEND_URL") || "http://localhost:3000"}/candidates/${data.candidateId}`;

    const text = `
${data.interviewerName} 您好：

${data.mentionedByName} @您查看候选人简历：

候选人：${data.candidateName}
${data.positionTitle ? `应聘职位：${data.positionTitle}` : ""}
${data.message ? `留言：${data.message}` : ""}

请查看候选人详情：
${candidateUrl}

Moka 面试系统
    `.trim();

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">简历评审邀请</h2>
  <p>${data.interviewerName} 您好：</p>
  <p><strong>${data.mentionedByName}</strong> @您查看候选人简历：</p>
  
  <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <p><strong>候选人：</strong>${data.candidateName}</p>
    ${data.positionTitle ? `<p><strong>应聘职位：</strong>${data.positionTitle}</p>` : ""}
    ${data.message ? `<p style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;"><strong>留言：</strong>${data.message}</p>` : ""}
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="${candidateUrl}" style="background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">查看候选人</a>
  </div>
  
  <p style="color: #999; margin-top: 30px;">Moka 面试系统</p>
</div>
    `.trim();

    return { text, html };
  }

  private buildProcessCompletedEmail(data: ProcessCompletedData): {
    text: string;
    html: string;
  } {
    const resultText = data.result === "HIRED" ? "已录用" : "已淘汰";

    const text = `
${data.hrName} 您好：

候选人 ${data.candidateName}（${data.positionTitle}）的面试流程已完成。

最终结果：${resultText}

请登录系统查看详细信息。

Moka 面试系统
    `.trim();

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">面试流程完成通知</h2>
  <p>${data.hrName} 您好：</p>
  <p>候选人 <strong>${data.candidateName}</strong>（${data.positionTitle}）的面试流程已完成。</p>
  
  <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <p><strong>最终结果：</strong>${resultText}</p>
  </div>
  
  <p style="color: #999; margin-top: 30px;">Moka 面试系统</p>
</div>
    `.trim();

    return { text, html };
  }

  private buildRoundCompletedEmail(data: RoundCompletedData): {
    text: string;
    html: string;
  } {
    const roundTypeText =
      data.roundType === "HR_SCREENING"
        ? "HR初筛"
        : data.roundType === "TECHNICAL"
          ? "技术面"
          : "终面";
    const resultText = data.result === "PASS" ? "通过" : "未通过";

    const text = `
${data.hrName} 您好：

候选人 ${data.candidateName}（${data.positionTitle}）已完成第${data.roundNumber}轮面试（${roundTypeText}）。

面试结果：${resultText}

请登录系统查看详细信息。

Moka 面试系统
    `.trim();

    const html = `
<div style="font-family: Arial, sans-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">面试轮次完成通知</h2>
  <p>${data.hrName} 您好：</p>
  <p>候选人 <strong>${data.candidateName}</strong>（${data.positionTitle}）已完成第${data.roundNumber}轮面试（${roundTypeText}）。</p>
  
  <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <p><strong>面试结果：</strong>${resultText}</p>
  </div>
  
  <p style="color: #999; margin-top: 30px;">Moka 面试系统</p>
</div>
    `.trim();

    return { text, html };
  }

  private formatDateTime(date: Date): string {
    return new Date(date).toLocaleString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  private formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}
