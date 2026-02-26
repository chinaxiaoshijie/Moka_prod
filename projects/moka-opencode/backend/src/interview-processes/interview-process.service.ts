import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import {
  CreateInterviewProcessDto,
  CreateRoundInterviewDto,
  ProcessResponseDto,
  ProcessListResponseDto,
  ProcessRoundConfig,
  ProcessInterviewDto,
} from "./dto/interview-process.dto";
import { InterviewType } from "@prisma/client";

@Injectable()
export class InterviewProcessService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
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
      },
    });

    if (!process) {
      throw new Error("面试流程不存在");
    }

    const roundConfig = process.rounds.find(
      (r) => r.roundNumber === roundNumber,
    );
    if (!roundConfig) {
      throw new Error(`第${roundNumber}轮未配置`);
    }

    // 确定面试类型
    let interviewType: InterviewType = InterviewType.INTERVIEW_1;
    if (roundNumber === 2) interviewType = InterviewType.INTERVIEW_2;
    else if (roundNumber === 3) interviewType = InterviewType.INTERVIEW_3;

    // 创建面试记录
    const interview = await this.prisma.interview.create({
      data: {
        candidateId: process.candidateId,
        positionId: process.positionId,
        interviewerId: roundConfig.interviewerId,
        type: interviewType,
        format: createDto.format,
        startTime: new Date(createDto.startTime),
        endTime: new Date(createDto.endTime),
        location: createDto.location,
        meetingUrl: createDto.meetingUrl,
        meetingNumber: createDto.meetingNumber,
        status: "SCHEDULED",
        processId: process.id,
        roundNumber: roundNumber,
        isHRRound: roundConfig.isHRRound,
      },
    });

    // 更新候选人状态
    await this.prisma.candidate.update({
      where: { id: process.candidateId },
      data: {
        status: `INTERVIEW_${roundNumber}` as any,
      },
    });

    // 发送邮件通知面试官
    const interviewer = await this.prisma.user.findUnique({
      where: { id: roundConfig.interviewerId },
    });

    if (interviewer?.email) {
      await this.emailService.sendInterviewNotificationToInterviewer({
        candidateName: process.candidate.name,
        candidateEmail: process.candidate.email || "",
        positionTitle: process.position.title,
        interviewerName: interviewer.name,
        interviewerEmail: interviewer.email,
        startTime: interview.startTime,
        endTime: interview.endTime,
        format: interview.format,
        location: interview.location || undefined,
        meetingUrl: interview.meetingUrl || undefined,
        meetingNumber: interview.meetingNumber || undefined,
      });
    }

    // 更新流程状态为进行中（如果是从等待HR状态恢复的）
    if (process.status === "WAITING_HR") {
      await this.prisma.interviewProcess.update({
        where: { id: processId },
        data: { status: "IN_PROGRESS" },
      });
    }

    return this.findOne(processId);
  }

  // HR确认当前轮次完成，推进到下一轮或结束流程
  async completeRoundAndProceed(
    processId: string,
    action: "next" | "complete" | "reject",
  ): Promise<ProcessResponseDto> {
    const process = await this.prisma.interviewProcess.findUnique({
      where: { id: processId },
      include: {
        candidate: true,
        position: true,
        createdBy: true,
      },
    });

    if (!process) {
      throw new Error("面试流程不存在");
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

      await this.prisma.candidate.update({
        where: { id: process.candidateId },
        data: { status: "HIRED" },
      });

      // 发送流程完成通知
      if (process.createdBy.email) {
        await this.emailService.sendProcessCompletedToHR({
          hrEmail: process.createdBy.email,
          candidateName: process.candidate.name,
          totalRounds: process.currentRound,
          finalResult: "已录用",
        });
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

      await this.prisma.candidate.update({
        where: { id: process.candidateId },
        data: { status: "REJECTED" },
      });

      // 发送流程完成通知
      if (process.createdBy.email) {
        await this.emailService.sendProcessCompletedToHR({
          hrEmail: process.createdBy.email,
          candidateName: process.candidate.name,
          totalRounds: process.currentRound,
          finalResult: "未通过",
        });
      }
    } else if (action === "next") {
      // 进入下一轮
      if (process.currentRound >= process.totalRounds) {
        throw new Error("已经是最后一轮");
      }

      await this.prisma.interviewProcess.update({
        where: { id: processId },
        data: {
          currentRound: process.currentRound + 1,
          status: "IN_PROGRESS",
        },
      });
    }

    return this.findOne(processId);
  }

  // 获取流程列表
  async findAll(
    page: number = 1,
    pageSize: number = 10,
    status?: string,
  ): Promise<ProcessListResponseDto> {
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (status) where.status = status;

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
                select: { name: true },
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
  async findOne(id: string): Promise<ProcessResponseDto> {
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
              select: { name: true },
            },
            feedbacks: true,
          },
          orderBy: { roundNumber: "asc" },
        },
      },
    });

    if (!process) {
      throw new Error("面试流程不存在");
    }

    return this.mapToResponseDto(process);
  }

  // 取消流程
  async cancel(id: string): Promise<ProcessResponseDto> {
    const process = await this.prisma.interviewProcess.findUnique({
      where: { id },
    });

    if (!process) {
      throw new Error("面试流程不存在");
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

    // 通知HR
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
        await this.emailService.sendRoundCompletedToHR({
          hrEmail: process.createdBy.email,
          candidateName: process.candidate.name,
          roundNumber,
          interviewerName: interview.interviewer.name,
          result: latestFeedback?.result || "未知",
        });
      }
    }
  }

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
          interviewerName: interview.interviewer.name,
          type: interview.type,
          format: interview.format,
          startTime: interview.startTime.toISOString(),
          status: interview.status,
          hasFeedback: interview.feedbacks.length > 0,
          feedbackResult: interview.feedbacks[0]?.result,
        }),
      ),
      createdAt: process.createdAt.toISOString(),
    };
  }
}
