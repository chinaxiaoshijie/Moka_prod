import { Injectable, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { InterviewProcessService } from "../interview-processes/interview-process.service";
import {
  CreateFeedbackDto,
  UpdateFeedbackDto,
  FeedbackResponseDto,
  FeedbackListResponseDto,
  InterviewFeedbackSummaryDto,
} from "./dto/feedback.dto";

@Injectable()
export class FeedbackService {
  constructor(
    private prisma: PrismaService,
    private processService: InterviewProcessService,
  ) {}

  async create(
    interviewerId: string,
    createDto: CreateFeedbackDto,
  ): Promise<FeedbackResponseDto> {
    // 检查面试是否存在
    const interview = await this.prisma.interview.findUnique({
      where: { id: createDto.interviewId },
      include: {
        candidate: true,
        position: true,
        feedbacks: true,
      },
    });

    if (!interview) {
      throw new Error("面试不存在");
    }

    // 校验1: 面试状态检查
    if (interview.status === "CANCELLED") {
      throw new Error("该面试已取消，无法提交反馈");
    }
    if (interview.status !== "SCHEDULED" && interview.status !== "COMPLETED") {
      throw new Error("该面试状态不允许提交反馈");
    }

    // 校验2: 提交者必须是该面试的指定面试官
    if (interview.interviewerId !== interviewerId) {
      throw new ForbiddenException("您不是该面试的指定面试官，无权提交反馈");
    }

    // 校验3: 如果属于流程，验证流程状态和轮次
    if (interview.processId && interview.roundNumber) {
      const process = await this.prisma.interviewProcess.findUnique({
        where: { id: interview.processId },
      });

      if (process) {
        if (process.status === "COMPLETED" || process.status === "CANCELLED") {
          throw new Error("面试流程已结束，无法提交反馈");
        }
        if (interview.roundNumber !== process.currentRound) {
          throw new Error("只能为当前轮次的面试提交反馈");
        }
      }
    }

    // 校验4: 检查是否已提交过反馈（防重复）
    const existingFeedback = await this.prisma.interviewFeedback.findFirst({
      where: {
        interviewId: createDto.interviewId,
        interviewerId,
      },
    });

    if (existingFeedback) {
      throw new Error("您已提交过该面试的反馈");
    }

    // P0-2: 事务保护 — feedback 创建 + interview 状态更新原子化
    const feedback = await this.prisma.$transaction(async (tx) => {
      const fb = await tx.interviewFeedback.create({
        data: {
          interviewId: createDto.interviewId,
          interviewerId,
          result: createDto.result,
          strengths: createDto.strengths,
          weaknesses: createDto.weaknesses,
          overallRating: createDto.overallRating,
          notes: createDto.notes,
        },
        include: {
          interview: {
            include: {
              candidate: true,
              position: true,
            },
          },
          interviewer: true,
        },
      });

      // 更新面试状态为已完成（在同一事务内）
      if (createDto.result !== "PENDING") {
        await tx.interview.update({
          where: { id: createDto.interviewId },
          data: { status: "COMPLETED" },
        });
      }

      return fb;
    });

    // 通知类操作放在事务外（失败不回滚主流程）
    if (createDto.result !== "PENDING") {
      if (interview.processId && interview.roundNumber) {
        try {
          await this.processService.onInterviewCompleted(
            interview.processId,
            interview.roundNumber,
          );
        } catch (error) {
          console.error("流程状态更新通知失败:", error);
        }
      }
    }

    return this.mapToResponseDto(feedback);
  }

  async findAll(): Promise<FeedbackListResponseDto> {
    const items = await this.prisma.interviewFeedback.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        interview: {
          include: {
            candidate: true,
            position: true,
          },
        },
        interviewer: true,
      },
    });

    return {
      items: items.map((item) => this.mapToResponseDto(item)),
      total: items.length,
    };
  }

  async findByInterview(
    interviewId: string,
  ): Promise<InterviewFeedbackSummaryDto> {
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        candidate: true,
        position: true,
        feedbacks: {
          include: {
            interviewer: true,
          },
        },
      },
    });

    if (!interview) {
      throw new Error("面试不存在");
    }

    const feedbacks = interview.feedbacks.map((feedback) =>
      this.mapToResponseDto({
        ...feedback,
        interview: {
          candidate: interview.candidate,
          position: interview.position,
          type: interview.type,
        },
      }),
    );

    // 计算平均评分
    const ratings = interview.feedbacks
      .map((f) => f.overallRating)
      .filter((r): r is number => r !== null);
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : null;

    // 确定最终结果
    const results = interview.feedbacks.map((f) => f.result);
    const passCount = results.filter((r) => r === "PASS").length;
    const failCount = results.filter((r) => r === "FAIL").length;
    let finalResult = "待定";
    if (passCount > failCount) {
      finalResult = "通过";
    } else if (failCount > passCount) {
      finalResult = "不通过";
    }

    return {
      interviewId: interview.id,
      candidateName: interview.candidate.name,
      positionTitle: interview.position.title,
      interviewType: interview.type,
      feedbacks,
      averageRating,
      finalResult,
    };
  }

  async findByInterviewer(
    interviewerId: string,
  ): Promise<FeedbackListResponseDto> {
    const items = await this.prisma.interviewFeedback.findMany({
      where: { interviewerId },
      orderBy: { createdAt: "desc" },
      include: {
        interview: {
          include: {
            candidate: true,
            position: true,
          },
        },
        interviewer: true,
      },
    });

    return {
      items: items.map((item) => this.mapToResponseDto(item)),
      total: items.length,
    };
  }

  // Feature 1: 反馈权限精细控制
  async update(
    id: string,
    interviewerId: string,
    updateDto: UpdateFeedbackDto,
  ): Promise<FeedbackResponseDto> {
    const feedback = await this.prisma.interviewFeedback.findFirst({
      where: {
        id,
        interviewerId,
      },
      include: {
        interview: true,
      },
    });

    if (!feedback) {
      throw new Error("反馈不存在或无权限修改");
    }

    // Feature 1: 检查是否可以修改结论（result）
    let canEditResult = true;
    if (feedback.interview.processId) {
      const process = await this.prisma.interviewProcess.findUnique({
        where: { id: feedback.interview.processId },
      });

      if (process) {
        // 只有当前轮次 + 流程进行中才能修改结论
        canEditResult =
          process.currentRound === feedback.interview.roundNumber &&
          process.status === "IN_PROGRESS";
      }
    }

    // 如果不能修改结论但 DTO 中包含 result，抛出权限错误
    if (!canEditResult && updateDto.result !== undefined) {
      throw new ForbiddenException("该轮次已结束，无法修改面试结论，仅可修改评语");
    }

    // 构建更新数据，不可修改结论时剔除 result 字段
    const updateData: any = { ...updateDto };
    if (!canEditResult) {
      delete updateData.result;
    }

    const updatedFeedback = await this.prisma.interviewFeedback.update({
      where: { id },
      data: updateData,
      include: {
        interview: {
          include: {
            candidate: true,
            position: true,
          },
        },
        interviewer: true,
      },
    });

    return this.mapToResponseDto(updatedFeedback);
  }

  async remove(id: string, interviewerId: string): Promise<void> {
    const feedback = await this.prisma.interviewFeedback.findFirst({
      where: {
        id,
        interviewerId,
      },
    });

    if (!feedback) {
      throw new Error("反馈不存在或无权限删除");
    }

    await this.prisma.interviewFeedback.delete({
      where: { id },
    });
  }

  private mapToResponseDto(feedback: any): FeedbackResponseDto {
    return {
      id: feedback.id,
      interviewId: feedback.interviewId,
      interview: {
        candidate: {
          name: feedback.interview.candidate.name,
        },
        position: {
          title: feedback.interview.position.title,
        },
        type: feedback.interview.type,
      },
      interviewerId: feedback.interviewerId,
      interviewer: {
        name: feedback.interviewer.name,
      },
      result: feedback.result,
      strengths: feedback.strengths,
      weaknesses: feedback.weaknesses,
      overallRating: feedback.overallRating,
      notes: feedback.notes,
      createdAt: feedback.createdAt,
    };
  }
}
