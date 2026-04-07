import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { EmailLimitService } from "../email/email-limit.service";
import {
  CreateInterviewDto,
  UpdateInterviewDto,
  InterviewResponseDto,
  InterviewListResponseDto,
} from "./dto/interview.dto";

@Injectable()
export class InterviewService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private emailLimitService: EmailLimitService,
  ) {}

  async create(createDto: CreateInterviewDto): Promise<InterviewResponseDto> {
    // ✅ 使用 upsert 避免竞态条件（替代 findFirst + update/create）
    const interview = await this.prisma.interview.upsert({
      where: {
        // 使用复合唯一键：同一流程的同一轮次只能有一个面试
        processId_roundNumber: {
          processId: createDto.processId,
          roundNumber: createDto.roundNumber,
        },
      },
      create: {
        candidateId: createDto.candidateId,
        positionId: createDto.positionId,
        interviewerId: createDto.interviewerId,
        type: createDto.type,
        format: createDto.format,
        startTime: new Date(createDto.startTime),
        endTime: new Date(createDto.endTime),
        location: createDto.location,
        meetingUrl: createDto.meetingUrl,
        meetingNumber: createDto.meetingNumber,
        processId: createDto.processId,
        roundNumber: createDto.roundNumber,
        status: "SCHEDULED",
      },
      update: {
        candidateId: createDto.candidateId,
        positionId: createDto.positionId,
        interviewerId: createDto.interviewerId,
        type: createDto.type,
        format: createDto.format,
        startTime: new Date(createDto.startTime),
        endTime: new Date(createDto.endTime),
        location: createDto.location,
        meetingUrl: createDto.meetingUrl,
        meetingNumber: createDto.meetingNumber,
        status: "SCHEDULED",
      },
      include: {
        candidate: true,
        position: true,
        interviewer: true,
      },
    });

    // ✅ 原则 1：移除自动发送邮件，改为 HR 手动发送
    // 邮件由 HR 在面试详情页手动编辑并发送

    return this.mapToResponseDto(interview);
  }

  async sendCandidateEmail(
    interviewId: string,
    customSubject?: string,
    customContent?: string,
    sentBy?: string,
  ): Promise<{ message: string }> {
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        candidate: true,
        position: true,
        interviewer: true,
        process: {
          include: {
            candidate: true,
            position: true,
          },
        },
      },
    });

    if (!interview) {
      throw new Error("面试安排不存在");
    }

    if (!interview.candidate.email) {
      throw new Error("候选人没有邮箱，无法发送邮件");
    }

    // ✅ 检查 2 小时内是否已发送过邮件，避免重复发送
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const recentEmailLogs = await this.prisma.interviewEmailLog.findMany({
      where: {
        interviewId: interviewId,
        sentAt: { gte: twoHoursAgo },
      },
      orderBy: { sentAt: "desc" },
      take: 1,
    });

    if (recentEmailLogs.length > 0) {
      const lastSent = recentEmailLogs[0].sentAt;
      throw new Error(
        `2 小时内已发送过邮件，请勿重复发送（上次发送时间：${lastSent.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}）`
      );
    }

    // ✅ 检查邮件发送频率限制
    const limitCheck = await this.emailLimitService.checkEmailLimit(
      interviewId,
      interview.candidateId,
    );

    if (!limitCheck.allowed) {
      throw new Error(`邮件发送受限：${limitCheck.reason}`);
    }

    try {
      if (customContent) {
        // 自定义内容邮件
        await this.emailService.sendCustomEmail({
          to: interview.candidate.email,
          subject: customSubject || `面试通知 - ${interview.position.title}`,
          content: customContent,
        });
      } else {
        // 标准面试通知邮件
        await this.emailService.sendInterviewNotificationToCandidate({
          candidateName: interview.candidate.name,
          candidateEmail: interview.candidate.email,
          positionTitle: interview.position.title,
          interviewerName: interview.interviewer.name || "面试官",
          interviewerEmail: interview.interviewer.email || "",
          startTime: interview.startTime,
          endTime: interview.endTime,
          format: interview.format,
          location: interview.location || undefined,
          meetingUrl: interview.meetingUrl || undefined,
          meetingNumber: interview.meetingNumber || undefined,
        });
      }

      // ✅ 记录邮件发送日志
      await this.prisma.interviewEmailLog.create({
        data: {
          interviewId: interviewId,
          candidateId: interview.candidateId,
          recipientEmail: interview.candidate.email,
          subject: customSubject || `面试通知 - ${interview.position.title}`,
          content: customContent || "标准面试通知模板",
          sentBy: sentBy || "system",
          status: "sent",
        },
      });

      return { message: "邮件已成功发送" };
    } catch (error) {
      // ✅ 记录发送失败的日志
      await this.prisma.interviewEmailLog.create({
        data: {
          interviewId: interviewId,
          candidateId: interview.candidateId,
          recipientEmail: interview.candidate.email || "",
          subject: customSubject || `面试通知 - ${interview.position.title}`,
          content: customContent || "标准面试通知模板",
          sentBy: sentBy || "system",
          status: "failed",
          errorMessage: (error as Error).message,
        },
      });

      console.error("发送邮件给候选人失败:", error);
      return { message: `邮件发送失败：${(error as Error).message}` };
    }
  }

  async findAll(
    page: number = 1,
    pageSize: number = 10,
    userId?: string,
    userRole?: string,
    positionId?: string,
  ): Promise<InterviewListResponseDto> {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.prisma.interview.findMany({
        skip,
        take: pageSize,
        orderBy: { startTime: "asc" },
        include: {
          candidate: true,
          position: true,
          interviewer: true,
          process: {
            include: {
              rounds: true,
            },
          },
          feedbacks: true,
        },
      }),
      this.prisma.interview.count(),
    ]);

    return {
      items: items.map((item) => this.mapToResponseDto(item)),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string): Promise<InterviewResponseDto> {
    const interview = await this.prisma.interview.findUnique({
      where: { id },
      include: {
        candidate: true,
        position: true,
        interviewer: true,
        process: {
          include: {
            rounds: true,
          },
        },
      },
    });

    if (!interview) {
      throw new Error("面试安排不存在");
    }

    return this.mapToResponseDto(interview);
  }

  async update(
    id: string,
    updateDto: UpdateInterviewDto,
  ): Promise<InterviewResponseDto> {
    const interview = await this.prisma.interview.findUnique({
      where: { id },
    });

    if (!interview) {
      throw new Error("面试安排不存在");
    }

    const data: any = { ...updateDto };
    if (updateDto.startTime) data.startTime = new Date(updateDto.startTime);
    if (updateDto.endTime) data.endTime = new Date(updateDto.endTime);

    const updatedInterview = await this.prisma.interview.update({
      where: { id },
      data,
      include: {
        candidate: true,
        position: true,
        interviewer: true,
      },
    });

    return this.mapToResponseDto(updatedInterview);
  }

  async remove(id: string): Promise<InterviewResponseDto> {
    const interview = await this.prisma.interview.findUnique({
      where: { id },
    });

    if (!interview) {
      throw new Error("面试安排不存在");
    }

    const deletedInterview = await this.prisma.interview.delete({
      where: { id },
      include: {
        candidate: true,
        position: true,
        interviewer: true,
      },
    });

    return this.mapToResponseDto(deletedInterview);
  }

  /**
   * 获取邮件发送历史
   */
  async getEmailHistory(interviewId: string, limit: number = 10): Promise<any> {
    return await this.emailLimitService.getEmailHistory(interviewId, undefined, limit);
  }

  private mapToResponseDto(interview: any): InterviewResponseDto {
    return {
      id: interview.id,
      candidateId: interview.candidateId,
      candidate: {
        name: interview.candidate.name,
        phone: interview.candidate.phone,
        email: interview.candidate.email,
      },
      positionId: interview.positionId,
      position: { title: interview.position.title },
      interviewerId: interview.interviewerId,
      interviewer: {
        name: interview.interviewer.name,
        email: interview.interviewer.email,
      },
      type: interview.type,
      format: interview.format,
      startTime: interview.startTime,
      endTime: interview.endTime,
      location: interview.location,
      meetingUrl: interview.meetingUrl,
      meetingNumber: interview.meetingNumber,
      status: interview.status,
      processId: interview.processId,
      roundNumber: interview.roundNumber,
      process: interview.process
        ? {
            id: interview.process.id,
            status: interview.process.status,
            totalRounds: interview.process.totalRounds,
            currentRound: interview.process.currentRound,
          }
        : null,
      createdAt: interview.createdAt,
    };
  }
}
