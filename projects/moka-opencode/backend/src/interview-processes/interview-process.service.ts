import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { CandidateStatusService } from "../candidates/candidate-status.service";
import { NotificationService } from "../notifications/notification.service";
import {
  CreateInterviewProcessDto,
  CreateRoundInterviewDto,
  UpdateRoundConfigDto,
  ProcessResponseDto,
  ProcessListResponseDto,
  ProcessRoundConfig,
  ProcessInterviewDto,
  ProcessFeedbackDto,
} from "./dto/interview-process.dto";
import { InterviewType, NotificationType } from "@prisma/client";

@Injectable()
export class InterviewProcessService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private candidateStatusService: CandidateStatusService,
    private notificationService: NotificationService,
  ) {}

  // 创建面试流程（启动流程）
  async create(
    createDto: CreateInterviewProcessDto,
    hrUserId: string,
  ): Promise<ProcessResponseDto> {
    const {
      candidateId,
      positionId,
      hasHRRound = true,
      totalRounds = 3,
      rounds,
    } = createDto;

    // 校验终面必须是最后一轮
    if (rounds.length > 0 && rounds[rounds.length - 1].roundType !== "FINAL") {
      throw new BadRequestException("终面必须是最后一轮");
    }

    // 校验最少3轮
    if (rounds.length < 3) {
      throw new BadRequestException("面试流程至少需要3轮（包括终面）");
    }

    // 创建流程主记录
    const process = await this.prisma.interviewProcess.create({
      data: {
        candidate: { connect: { id: candidateId } },
        position: { connect: { id: positionId } },
        hasHRRound,
        totalRounds,
        status: "IN_PROGRESS",
        currentRound: 1,
        createdBy: { connect: { id: hrUserId } },
      },
    });

    // ✅ 同步更新候选人的 positionId
    await this.prisma.candidate.update({
      where: { id: candidateId },
      data: { positionId },
    });

    // 创建轮次配置
    await Promise.all(
      rounds.map((round) =>
        this.prisma.interviewRound.create({
          data: {
            processId: process.id,
            roundNumber: round.roundNumber,
            interviewerId: round.interviewerId,
            isHRRound: round.isHRRound,
            roundType: round.roundType,
          },
        }),
      ),
    );

    return this.findOne(process.id);
  }

  // 为指定轮次创建面试安排
  async createRoundInterview(
    processId: string,
    roundNumber: number,
    createDto: CreateRoundInterviewDto,
  ): Promise<ProcessResponseDto> {
    const process = await this.prisma.interviewProcess.findUnique({
      where: { id: processId },
      include: {
        rounds: true,
        candidate: true,
        position: true,
        createdBy: true,
      },
    });

    if (!process) {
      throw new BadRequestException("面试流程不存在");
    }

    const roundConfig = process.rounds.find(
      (r) => r.roundNumber === roundNumber,
    );
    if (!roundConfig) {
      throw new BadRequestException(`第${roundNumber}轮未配置`);
    }

    // 确定面试类型：基于轮次类型而非轮次编号
    let interviewType: InterviewType;
    switch (roundConfig.roundType) {
      case "FINAL":
        interviewType = InterviewType.INTERVIEW_3;
        break;
      case "HR_SCREENING":
        interviewType = InterviewType.INTERVIEW_1;
        break;
      default:
        interviewType = InterviewType.INTERVIEW_2;
        break;
    }

    // 校验日期有效性
    const startTime = new Date(createDto.startTime);
    const endTime = new Date(createDto.endTime);
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new BadRequestException("请填写有效的开始时间和结束时间");
    }

    // ✅ 使用 upsert 避免竞态条件（替代 findFirst + update/create）
    const interview = await this.prisma.interview.upsert({
      where: {
        // 使用复合唯一键：同一流程的同一轮次只能有一个面试
        processId_roundNumber: {
          processId: process.id,
          roundNumber: roundNumber,
        },
      },
      create: {
        candidateId: process.candidateId,
        positionId: process.positionId,
        interviewerId: roundConfig.interviewerId,
        type: interviewType,
        format: createDto.format,
        startTime,
        endTime,
        location: createDto.location,
        meetingUrl: createDto.meetingUrl,
        meetingNumber: createDto.meetingNumber,
        status: "SCHEDULED",
        processId: process.id,
        roundNumber: roundNumber,
        isHRRound: roundConfig.isHRRound,
      },
      update: {
        candidateId: process.candidateId,
        positionId: process.positionId,
        interviewerId: roundConfig.interviewerId,
        type: interviewType,
        format: createDto.format,
        startTime,
        endTime,
        location: createDto.location,
        meetingUrl: createDto.meetingUrl,
        meetingNumber: createDto.meetingNumber,
        status: "SCHEDULED",
        processId: process.id,
        roundNumber: roundNumber,
        isHRRound: roundConfig.isHRRound,
      },
    });

    // P0-1: 通过 CandidateStatusService 更新候选人状态（含历史记录）
    // 使用 interviewType 映射候选人状态，而非 roundNumber
    const candidateStatus = interviewType as string;
    const roundTypeLabel =
      roundConfig.roundType === "FINAL" ? "终试" :
      roundConfig.roundType === "HR_SCREENING" ? "初试" : "复试";
    try {
      await this.candidateStatusService.updateCandidateStatus(
        process.candidateId,
        candidateStatus,
        process.createdById,
        `面试安排 - ${roundTypeLabel}（第${roundNumber}轮）`,
        interview.id,
      );
    } catch (error) {
      // 状态转换不允许时仅记日志，不阻塞面试安排
      console.warn("候选人状态更新跳过:", (error as Error).message);
    }

    // ✅ 原则 1：移除自动发送邮件，改为 HR 手动发送
    // 邮件由 HR 在面试详情页手动编辑并发送
    // 已移除面试官邮件和候选人邮件的自动发送逻辑

    // 更新流程状态为进行中（如果是从等待HR状态恢复的）
    if (process.status === "WAITING_HR") {
      await this.prisma.interviewProcess.update({
        where: { id: processId },
        data: { status: "IN_PROGRESS" },
      });
    }

    // Feature 2: 站内通知 — 通知面试官有新面试
    try {
      await this.notificationService.create({
        userId: roundConfig.interviewerId,
        type: NotificationType.INTERVIEW_REMINDER,
        title: "新面试安排",
        content: `您有新面试：候选人${process.candidate.name}，职位${process.position.title}，第${roundNumber}轮`,
        link: `/interview-processes/${processId}`,
      });
    } catch (error) {
      console.error("站内通知发送失败:", error);
    }

    return this.findOne(processId);
  }

  // HR确认当前轮次完成，推进到下一轮或结束流程
  async completeRoundAndProceed(
    processId: string,
    action: "next" | "complete" | "reject",
    userId?: string,
  ): Promise<ProcessResponseDto> {
    const process = await this.prisma.interviewProcess.findUnique({
      where: { id: processId },
      include: {
        candidate: true,
        position: true,
        createdBy: true,
        rounds: true,
      },
    });

    if (!process) {
      throw new BadRequestException("面试流程不存在");
    }

    // P1-1: 验证当前轮次面试是否真正完成
    const currentRoundInterview = await this.prisma.interview.findFirst({
      where: {
        processId,
        roundNumber: process.currentRound,
      },
    });

    if (!currentRoundInterview || currentRoundInterview.status !== "COMPLETED") {
      throw new BadRequestException("当前轮次面试尚未完成，无法推进");
    }

    if (action === "complete") {
      // 录用候选人
      await this.prisma.interviewProcess.update({
        where: { id: processId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      // P0-1: 通过 CandidateStatusService 更新（含历史记录）
      await this.candidateStatusService.updateCandidateStatus(
        process.candidateId,
        "HIRED",
        userId || process.createdById,
        "面试流程完成 - 录用",
        currentRoundInterview.id,
      );

      // P1-2: 邮件异常隔离
      if (process.createdBy.email) {
        try {
          await this.emailService.sendProcessCompletedToHR({
            hrEmail: process.createdBy.email,
            candidateName: process.candidate.name,
            totalRounds: process.currentRound,
            finalResult: "已录用",
          });
        } catch (error) {
          console.error("流程完成邮件发送失败:", error);
        }
      }
    } else if (action === "reject") {
      // 拒绝候选人
      await this.prisma.interviewProcess.update({
        where: { id: processId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      // P0-1: 通过 CandidateStatusService 更新（含历史记录）
      await this.candidateStatusService.updateCandidateStatus(
        process.candidateId,
        "REJECTED",
        userId || process.createdById,
        "面试流程完成 - 未通过",
        currentRoundInterview.id,
      );

      // P1-2: 邮件异常隔离
      if (process.createdBy.email) {
        try {
          await this.emailService.sendProcessCompletedToHR({
            hrEmail: process.createdBy.email,
            candidateName: process.candidate.name,
            totalRounds: process.currentRound,
            finalResult: "未通过",
          });
        } catch (error) {
          console.error("流程完成邮件发送失败:", error);
        }
      }
    } else if (action === "next") {
      // 进入下一轮
      if (process.currentRound >= process.totalRounds) {
        throw new BadRequestException("已经是最后一轮");
      }

      const nextRound = process.currentRound + 1;

      await this.prisma.interviewProcess.update({
        where: { id: processId },
        data: {
          currentRound: nextRound,
          status: "IN_PROGRESS",
        },
      });

      // Feature 2: 站内通知 — 通知下一轮面试官
      const nextRoundConfig = process.rounds.find(
        (r) => r.roundNumber === nextRound,
      );
      if (nextRoundConfig) {
        try {
          await this.notificationService.create({
            userId: nextRoundConfig.interviewerId,
            type: NotificationType.PROCESS_UPDATE,
            title: "新一轮面试即将开始",
            content: `候选人${process.candidate.name}即将进入您的第${nextRound}轮面试环节，职位${process.position.title}`,
            link: `/interview-processes/${processId}`,
          });
        } catch (error) {
          console.error("下一轮站内通知发送失败:", error);
        }
      }
    }

    return this.findOne(processId);
  }

  // Feature 3: HR 调整未来轮次配置
  async updateRoundConfig(
    processId: string,
    roundNumber: number,
    updateDto: UpdateRoundConfigDto,
  ): Promise<ProcessResponseDto> {
    const process = await this.prisma.interviewProcess.findUnique({
      where: { id: processId },
      include: { rounds: true },
    });

    if (!process) {
      throw new BadRequestException("面试流程不存在");
    }

    if (process.status === "COMPLETED" || process.status === "CANCELLED") {
      throw new BadRequestException("流程已结束，无法修改配置");
    }

    if (roundNumber <= process.currentRound) {
      throw new BadRequestException("只能修改未来轮次的配置");
    }

    const roundConfig = process.rounds.find(
      (r) => r.roundNumber === roundNumber,
    );
    if (!roundConfig) {
      throw new BadRequestException(`第${roundNumber}轮未配置`);
    }

    // 更新轮次配置
    const updateData: any = {};
    if (updateDto.interviewerId) updateData.interviewerId = updateDto.interviewerId;
    if (updateDto.roundType) updateData.roundType = updateDto.roundType;

    await this.prisma.interviewRound.update({
      where: { id: roundConfig.id },
      data: updateData,
    });

    // 如果该轮已有面试记录，同步更新面试官
    if (updateDto.interviewerId) {
      await this.prisma.interview.updateMany({
        where: {
          processId,
          roundNumber,
          status: "SCHEDULED",
        },
        data: { interviewerId: updateDto.interviewerId },
      });
    }

    // 验证更新后仍至少3轮
    const updatedRounds = await this.prisma.interviewRound.findMany({
      where: { processId },
    });
    if (updatedRounds.length < 3) {
      throw new BadRequestException("面试流程至少需要3轮（包括终面）");
    }

    return this.findOne(processId);
  }

  // 获取流程列表
  async findAll(
    page: number = 1,
    pageSize: number = 10,
    status?: string,
    userId?: string,
    userRole?: string,
  ): Promise<ProcessListResponseDto> {
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (status) where.status = status;
    
    // 面试官权限隔离：只能看到自己参与的面试流程
    if (userRole === "INTERVIEWER" && userId) {
      where.OR = [
        { rounds: { some: { interviewerId: userId } } },
        { interviews: { some: { interviewerId: userId } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.interviewProcess.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          candidate: true,
          position: true,
          rounds: {
            include: {
              interviewer: {
                select: { id: true, name: true, email: true },
              },
            },
          },
          interviews: {
            include: {
              interviewer: {
                select: { id: true, name: true },
              },
              feedbacks: true,
            },
          },
        },
      }),
      this.prisma.interviewProcess.count({ where }),
    ]);

    return {
      items: items.map((item) => this.mapToResponseDto(item)),
      total,
      page,
      pageSize,
    };
  }

  // 获取单个流程详情
  async findOne(id: string, userId?: string, userRole?: string): Promise<ProcessResponseDto> {
    const process = await this.prisma.interviewProcess.findUnique({
      where: { id },
      include: {
        candidate: true,
        position: true,
        rounds: {
          include: {
            interviewer: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { roundNumber: "asc" },
        },
        interviews: {
          include: {
            interviewer: {
              select: { id: true, name: true },
            },
            feedbacks: {
              include: {
                interviewer: {
                  select: { id: true, name: true },
                },
              },
            },
          },
          orderBy: { roundNumber: "asc" },
        },
      },
    });

    if (!process) {
      throw new BadRequestException("面试流程不存在");
    }
    
    // 面试官权限检查：只能查看自己参与的流程
    if (userRole === "INTERVIEWER" && userId) {
      const isParticipating = 
        process.rounds.some((r) => r.interviewerId === userId) ||
        process.interviews.some((i) => i.interviewerId === userId);
      
      if (!isParticipating) {
        throw new BadRequestException("无权查看该面试流程");
      }
    }

    return this.mapToResponseDto(process);
  }

  // 取消流程
  async cancel(id: string): Promise<ProcessResponseDto> {
    const process = await this.prisma.interviewProcess.findUnique({
      where: { id },
    });

    if (!process) {
      throw new BadRequestException("面试流程不存在");
    }

    await this.prisma.interviewProcess.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    // 取消所有待进行的面试
    await this.prisma.interview.updateMany({
      where: {
        processId: id,
        status: "SCHEDULED",
      },
      data: { status: "CANCELLED" },
    });

    return this.findOne(id);
  }

  // 面试完成后更新流程状态为等待HR确认
  async onInterviewCompleted(
    processId: string,
    roundNumber: number,
  ): Promise<void> {
    const process = await this.prisma.interviewProcess.findUnique({
      where: { id: processId },
      include: {
        candidate: true,
        createdBy: true,
      },
    });

    if (!process) return;

    // 更新流程状态为等待HR确认
    await this.prisma.interviewProcess.update({
      where: { id: processId },
      data: { status: "WAITING_HR" },
    });

    // Feature 2: 站内通知 — 通知HR轮次完成
    try {
      await this.notificationService.create({
        userId: process.createdById,
        type: NotificationType.PROCESS_UPDATE,
        title: "轮次面试已完成",
        content: `候选人${process.candidate.name}第${roundNumber}轮面试已完成，请确认下一步操作`,
        link: `/interview-processes/${processId}`,
      });
    } catch (error) {
      console.error("HR站内通知发送失败:", error);
    }

    // P1-2: 邮件异常隔离
    if (process.createdBy.email) {
      const interview = await this.prisma.interview.findFirst({
        where: { processId, roundNumber },
        include: {
          interviewer: { select: { name: true } },
          feedbacks: true,
        },
      });

      if (interview) {
        const latestFeedback =
          interview.feedbacks[interview.feedbacks.length - 1];
        try {
          await this.emailService.sendRoundCompletedToHR({
            hrEmail: process.createdBy.email,
            candidateName: process.candidate.name,
            roundNumber,
            interviewerName: interview.interviewer.name,
            result: latestFeedback?.result || "未知",
          });
        } catch (error) {
          console.error("轮次完成邮件发送失败:", error);
        }
      }
    }
  }

  // Feature 5: 补全 API Response
  private mapToResponseDto(process: any): ProcessResponseDto {
    return {
      id: process.id,
      candidateId: process.candidateId,
      candidateName: process.candidate.name,
      positionId: process.positionId,
      positionTitle: process.position.title,
      currentRound: process.currentRound,
      totalRounds: process.totalRounds,
      status: process.status,
      hasHRRound: process.hasHRRound,
      createdById: process.createdById,
      rounds: process.rounds.map(
        (round: any): ProcessRoundConfig => ({
          roundNumber: round.roundNumber,
          interviewerId: round.interviewerId,
          interviewerName: round.interviewer.name,
          isHRRound: round.isHRRound,
          roundType: round.roundType,
        }),
      ),
      interviews: process.interviews.map(
        (interview: any): ProcessInterviewDto => ({
          id: interview.id,
          roundNumber: interview.roundNumber || 0,
          interviewerId: interview.interviewerId,
          interviewerName: interview.interviewer.name,
          type: interview.type,
          format: interview.format,
          startTime: interview.startTime.toISOString(),
          endTime: interview.endTime ? interview.endTime.toISOString() : null,
          status: interview.status,
          location: interview.location,
          meetingUrl: interview.meetingUrl,
          meetingNumber: interview.meetingNumber,
          hasFeedback: interview.feedbacks.length > 0,
          feedbackResult: interview.feedbacks[0]?.result,
          feedbacks: interview.feedbacks.map(
            (fb: any): ProcessFeedbackDto => ({
              id: fb.id,
              interviewerId: fb.interviewerId,
              interviewerName: fb.interviewer?.name || "未知",
              result: fb.result,
              notes: fb.notes,
              strengths: fb.strengths,
              weaknesses: fb.weaknesses,
              overallRating: fb.overallRating,
              createdAt: fb.createdAt.toISOString(),
            }),
          ),
        }),
      ),
      createdAt: process.createdAt.toISOString(),
    };
  }
}
