import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export interface EmailLog {
  id: string;
  interviewId: string;
  candidateId: string;
  recipientEmail: string;
  subject: string;
  content: string;
  sentBy: string;
  sentAt: Date;
  status: string;
  errorMessage?: string;
}

export interface EmailLimitCheck {
  allowed: boolean;
  reason?: string;
  lastSentAt?: Date;
  sentCount24h?: number;
}

@Injectable()
export class EmailLimitService {
  constructor(private prisma: PrismaService) {}

  /**
   * 检查是否允许发送邮件
   * 限制规则：
   * 1. 同一面试 1 小时内不能重复发送
   * 2. 同一候选人 24 小时内最多发送 5 封邮件
   */
  async checkEmailLimit(
    interviewId: string,
    candidateId: string,
  ): Promise<EmailLimitCheck> {
    const now = new Date();
    
    // 检查 1 小时内是否已发送
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentEmail = await this.prisma.interviewEmailLog.findFirst({
      where: {
        interviewId,
        sentAt: { gte: oneHourAgo },
        status: 'sent',
      },
      orderBy: { sentAt: 'desc' },
    });

    if (recentEmail) {
      return {
        allowed: false,
        reason: '同一面试 1 小时内不能重复发送',
        lastSentAt: recentEmail.sentAt,
      };
    }

    // 检查 24 小时内发送次数
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sentCount24h = await this.prisma.interviewEmailLog.count({
      where: {
        candidateId,
        sentAt: { gte: twentyFourHoursAgo },
        status: 'sent',
      },
    });

    if (sentCount24h >= 5) {
      return {
        allowed: false,
        reason: '同一候选人 24 小时内最多发送 5 封邮件',
        sentCount24h,
      };
    }

    return {
      allowed: true,
      sentCount24h,
    };
  }

  /**
   * 记录邮件发送日志
   */
  async logEmail(
    data: {
      interviewId: string;
      candidateId: string;
      recipientEmail: string;
      subject: string;
      content: string;
      sentBy: string;
    },
    status: 'sent' | 'failed' = 'sent',
    errorMessage?: string,
  ): Promise<EmailLog> {
    const log = await this.prisma.interviewEmailLog.create({
      data: {
        id: this.generateId(),
        interviewId: data.interviewId,
        candidateId: data.candidateId,
        recipientEmail: data.recipientEmail,
        subject: data.subject,
        content: data.content,
        sentBy: data.sentBy,
        status,
        errorMessage,
      },
    });

    return log;
  }

  /**
   * 获取邮件发送历史
   */
  async getEmailHistory(
    interviewId?: string,
    candidateId?: string,
    limit: number = 10,
  ): Promise<EmailLog[]> {
    const where: any = {};
    
    if (interviewId) {
      where.interviewId = interviewId;
    }
    
    if (candidateId) {
      where.candidateId = candidateId;
    }

    const logs = await this.prisma.interviewEmailLog.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      take: limit,
    });

    return logs;
  }

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return `EMAIL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
