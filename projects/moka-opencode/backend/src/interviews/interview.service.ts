import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { EmailLimitService } from "../email/email-limit.service";
import { NotificationService } from "../notifications/notification.service";
import { FeishuCalendarService } from "../feishu/feishu-calendar.service";
import { NotificationType } from "@prisma/client";
import {
  CreateInterviewDto,
  UpdateInterviewDto,
  InterviewResponseDto,
  InterviewListResponseDto,
} from "./dto/interview.dto";

@Injectable()
export class InterviewService {
  private readonly logger = new Logger(InterviewService.name);
  
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private emailLimitService: EmailLimitService,
    private notificationService: NotificationService,
    private feishuCalendarService: FeishuCalendarService,
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
    candidateEmail?: string,
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

    // 优先使用传入的 candidateEmail，否则使用候选人记录中的邮箱
    const recipientEmail = candidateEmail || interview.candidate.email;

    if (!recipientEmail) {
      throw new Error("候选人没有邮箱，无法发送邮件");
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
          to: recipientEmail,
          subject: customSubject || `面试通知 - ${interview.position.title}`,
          content: customContent,
        });
      } else {
        // 标准面试通知邮件
        await this.emailService.sendInterviewNotificationToCandidate({
          candidateName: interview.candidate.name,
          candidateEmail: recipientEmail,
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
          recipientEmail: recipientEmail,
          subject: customSubject || `面试通知 - ${interview.position.title}`,
          content: customContent || "标准面试通知模板",
          sentBy: sentBy || "system",
          status: "sent",
        },
      });

      this.logger.log(`面试邮件发送成功：interviewId=${interviewId}, candidateId=${interview.candidateId}`);
      return { message: "邮件已成功发送" };
    } catch (error) {
      // ✅ 记录发送失败的日志
      await this.prisma.interviewEmailLog.create({
        data: {
          interviewId: interviewId,
          candidateId: interview.candidateId,
          recipientEmail: recipientEmail || "",
          subject: customSubject || `面试通知 - ${interview.position.title}`,
          content: customContent || "标准面试通知模板",
          sentBy: sentBy || "system",
          status: "failed",
          errorMessage: (error as Error).message,
        },
      });

      this.logger.error(`面试邮件发送失败：interviewId=${interviewId}`, error as Error);
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

    // 记录变更字段，用于判断是否需要通知
    const timeChanged = (updateDto.startTime && new Date(updateDto.startTime).getTime() !== interview.startTime.getTime()) ||
                        (updateDto.endTime && new Date(updateDto.endTime).getTime() !== interview.endTime.getTime());
    const interviewerChanged = updateDto.interviewerId && updateDto.interviewerId !== interview.interviewerId;

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
        process: {
          include: {
            createdBy: true,
          },
        },
      },
    });

    // 面试时间调整或面试官更换时，自动通知新面试官
    if (timeChanged || interviewerChanged) {
      try {
        const interviewer = updatedInterview.interviewer;
        if (interviewer?.email) {
          // 获取当前轮次的 AI 诊断结果（如果有）
          let aiDiagnosisData: any = null;
          try {
            const existingDiagnosis = await this.prisma.aIDiagnosis.findUnique({
              where: {
                processId_roundNumber: {
                  processId: updatedInterview.processId,
                  roundNumber: updatedInterview.roundNumber,
                },
              },
            });
            if (existingDiagnosis) {
              aiDiagnosisData = {
                matchScore: existingDiagnosis.matchScore,
                matchLevel: existingDiagnosis.matchLevel,
                strengths: existingDiagnosis.strengths || [],
                weaknesses: existingDiagnosis.weaknesses || [],
                suggestions: existingDiagnosis.suggestions || [],
                questions: existingDiagnosis.questions || [],
                summary: existingDiagnosis.summary || "",
              };
            }
          } catch { /* ignore */ }

          await this.emailService.sendInterviewNotificationToInterviewer({
            candidateName: updatedInterview.candidate.name,
            candidateEmail: updatedInterview.candidate.email || "",
            positionTitle: updatedInterview.position.title,
            interviewerName: interviewer.name,
            interviewerEmail: interviewer.email,
            startTime: updatedInterview.startTime,
            endTime: updatedInterview.endTime,
            format: updatedInterview.format,
            roundNumber: updatedInterview.roundNumber,
            location: updatedInterview.location || undefined,
            meetingUrl: updatedInterview.meetingUrl || undefined,
            meetingNumber: updatedInterview.meetingNumber || undefined,
            aiDiagnosis: aiDiagnosisData,
          });
          this.logger.log(`面试时间调整/面试官更换通知发送成功：interviewId=${id}, interviewerId=${interviewer.id}`);
        } else {
          this.logger.warn(`面试官未配置邮箱，跳过邮件通知：interviewerId=${interviewer?.id}`);
        }
      } catch (error) {
        this.logger.error(`面试官邮件通知发送失败：interviewId=${id}`, error as Error);
      }

      // 站内通知
      try {
        await this.notificationService.create({
          userId: updatedInterview.interviewerId,
          type: NotificationType.INTERVIEW_REMINDER,
          title: timeChanged ? "面试时间调整" : "新面试安排",
          content: timeChanged
            ? `候选人${updatedInterview.candidate.name}面试时间已调整，请准时参加`
            : `您有新面试：候选人${updatedInterview.candidate.name}，职位${updatedInterview.position.title}`,
          link: `/interviews/${id}`,
        });
      } catch (error) {
        this.logger.error(`站内通知发送失败：interviewId=${id}`, error as Error);
      }
    }

    // 飞书日历同步更新 — 时间变更且存在日程ID时，先删后建
    if (timeChanged && updatedInterview.feishuEventId) {
      try {
        const interviewerOuId = updatedInterview.interviewer?.feishuOuId;
        const hrOuId = updatedInterview.process?.createdBy?.feishuOuId;

        const attendeeOuIds: string[] = [];
        if (interviewerOuId) attendeeOuIds.push(interviewerOuId);
        if (hrOuId) attendeeOuIds.push(hrOuId);

        if (attendeeOuIds.length > 0) {
          const roundTypeLabel =
            updatedInterview.type === "INTERVIEW_3"
              ? "终试"
              : updatedInterview.type === "INTERVIEW_1"
              ? "初试"
              : "复试";
          const title = `[${roundTypeLabel}] 面试 - ${updatedInterview.candidate.name} - ${updatedInterview.position.title}`;

          const formatLabel = updatedInterview.format === "ONLINE" ? "线上（腾讯会议）" : "线下";
          const locationLines: string[] = [];
          if (updatedInterview.format === "ONLINE") {
            if (updatedInterview.meetingUrl) locationLines.push(`会议链接：${updatedInterview.meetingUrl}`);
            if (updatedInterview.meetingNumber) locationLines.push(`会议号：${updatedInterview.meetingNumber}`);
          } else {
            if (updatedInterview.location) locationLines.push(`地点：${updatedInterview.location}`);
          }

          const description = [
            `候选人：${updatedInterview.candidate.name}`,
            updatedInterview.candidate.phone ? `电话：${updatedInterview.candidate.phone}` : null,
            updatedInterview.candidate.email ? `邮箱：${updatedInterview.candidate.email}` : null,
            `面试官：${updatedInterview.interviewer?.name || "未指定"}`,
            `面试方式：${formatLabel}`,
            ...locationLines,
            updatedInterview.roundNumber ? `轮次：第${updatedInterview.roundNumber}轮（${roundTypeLabel}）` : null,
          ].filter(Boolean).join("\n");

          // 先删除旧日程
          await this.feishuCalendarService.deleteEvent(updatedInterview.feishuEventId);
          this.logger.log(`飞书日历旧日程已删除：eventId=${updatedInterview.feishuEventId}`);

          // 创建新日程
          const newEventId = await this.feishuCalendarService.createEvent(
            title,
            description,
            updatedInterview.startTime,
            updatedInterview.endTime,
            attendeeOuIds,
          );
          if (newEventId) {
            await this.prisma.interview.update({
              where: { id },
              data: { feishuEventId: newEventId },
            });
          }
          this.logger.log(`飞书日历重建成功：newEventId=${newEventId}, interviewId=${id}`);
        }
      } catch (error) {
        this.logger.warn(`飞书日历同步更新失败：interviewId=${id}, reason=${(error as Error).message}`);
      }
    }

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
   * 处理面试取消 — 同步删除飞书日历日程
   * @param interviewId 面试ID
   * @param feishuEventId 飞书日程ID
   */
  async handleInterviewCancel(interviewId: string, feishuEventId: string): Promise<void> {
    if (!feishuEventId) {
      this.logger.warn(`飞书日历取消跳过：无日程ID，interviewId=${interviewId}`);
      return;
    }

    try {
      await this.feishuCalendarService.deleteEvent(feishuEventId);
      this.logger.log(`飞书日历同步删除成功：eventId=${feishuEventId}, interviewId=${interviewId}`);
    } catch (error) {
      this.logger.warn(
        `飞书日历同步删除失败：interviewId=${interviewId}, eventId=${feishuEventId}, reason=${(error as Error).message}`,
      );
    }
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
