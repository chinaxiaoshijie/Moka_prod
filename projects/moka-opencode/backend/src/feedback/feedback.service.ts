import { Injectable } from "@nestjs/common";
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

    // 检查是否已提交过反馈
    const existingFeedback = await this.prisma.interviewFeedback.findFirst({
      where: {
        interviewId: createDto.interviewId,
        interviewerId,
      },
    });

    if (existingFeedback) {
      throw new Error("您已提交过该面试的反馈");
    }

    const feedback = await this.prisma.interviewFeedback.create({
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

    // 更新面试状态为已完成
    if (createDto.result !== "PENDING") {
      await this.prisma.interview.update({
        where: { id: createDto.interviewId },
        data: { status: "COMPLETED" },
      });

      // 如果面试属于某个流程，通知流程服务
      if (interview.processId && interview.roundNumber) {
        await this.processService.onInterviewCompleted(
          interview.processId,
          interview.roundNumber,
        );
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
    });

    if (!feedback) {
      throw new Error("反馈不存在或无权限修改");
    }

    const updatedFeedback = await this.prisma.interviewFeedback.update({
      where: { id },
      data: updateDto,
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
