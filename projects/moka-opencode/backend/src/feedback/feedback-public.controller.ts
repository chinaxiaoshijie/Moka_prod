import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
  Req,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { ConfigService } from "@nestjs/config";
import { randomBytes } from "crypto";
import { CandidateStatusService } from "../candidates/candidate-status.service";
import { InterviewProcessService } from "../interview-processes/interview-process.service";

@Controller("feedback")
export class FeedbackPublicController {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private configService: ConfigService,
    private candidateStatusService: CandidateStatusService,
    private processService: InterviewProcessService,
  ) {}

  @Post("generate-token/:interviewId")
  async generateFeedbackToken(
    @Param("interviewId") interviewId: string,
    @Req() req: any,
  ) {
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        candidate: true,
        position: true,
        interviewer: true,
      },
    });

    if (!interview) {
      throw new HttpException("面试不存在", HttpStatus.NOT_FOUND);
    }

    const existingToken = await this.prisma.feedbackToken.findUnique({
      where: { interviewId },
    });

    if (
      existingToken &&
      !existingToken.isUsed &&
      new Date(existingToken.expiresAt) > new Date()
    ) {
      const frontendUrl =
        this.configService.get("FRONTEND_URL") || "http://localhost:3000";
      const feedbackUrl = `${frontendUrl}/feedback/submit?token=${existingToken.token}`;

      return {
        token: existingToken.token,
        feedbackUrl,
        expiresAt: existingToken.expiresAt,
        message: "Token已存在",
      };
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.feedbackToken.upsert({
      where: { interviewId },
      update: {
        token,
        expiresAt,
        isUsed: false,
        usedAt: null,
      },
      create: {
        interviewId,
        interviewerId: interview.interviewerId,
        token,
        expiresAt,
      },
    });

    const frontendUrl =
      this.configService.get("FRONTEND_URL") || "http://localhost:3000";
    const feedbackUrl = `${frontendUrl}/feedback/submit?token=${token}`;

    if (interview.interviewer.email) {
      try {
        await this.emailService.sendFeedbackReminder({
          interviewerName: interview.interviewer.name,
          interviewerEmail: interview.interviewer.email,
          candidateName: interview.candidate.name,
          positionTitle: interview.position.title,
          interviewType: interview.type,
          interviewId: interview.id,
          feedbackUrl,
        });
      } catch (error) {
        console.error("Failed to send feedback email:", error);
      }
    }

    return {
      token,
      feedbackUrl,
      expiresAt,
    };
  }

  @Get("verify-token")
  async verifyToken(@Query("token") token: string) {
    const feedbackToken = await this.prisma.feedbackToken.findUnique({
      where: { token },
      include: {
        interview: {
          include: {
            candidate: true,
            position: true,
            interviewer: true,
          },
        },
      },
    });

    if (!feedbackToken) {
      throw new HttpException("无效的Token", HttpStatus.NOT_FOUND);
    }

    if (feedbackToken.isUsed) {
      throw new HttpException("该反馈已提交", HttpStatus.BAD_REQUEST);
    }

    if (new Date(feedbackToken.expiresAt) < new Date()) {
      throw new HttpException("Token已过期", HttpStatus.BAD_REQUEST);
    }

    return {
      valid: true,
      interview: {
        id: feedbackToken.interview.id,
        type: feedbackToken.interview.type,
        startTime: feedbackToken.interview.startTime,
        candidate: {
          name: feedbackToken.interview.candidate.name,
        },
        position: {
          title: feedbackToken.interview.position.title,
        },
        interviewer: {
          name: feedbackToken.interview.interviewer.name,
        },
      },
    };
  }

  @Post("submit")
  async submitFeedback(
    @Body()
    body: {
      token: string;
      result: "PASS" | "FAIL" | "PENDING";
      strengths?: string;
      weaknesses?: string;
      overallRating?: number;
      notes?: string;
    },
  ) {
    const feedbackToken = await this.prisma.feedbackToken.findUnique({
      where: { token: body.token },
    });

    if (!feedbackToken) {
      throw new HttpException("无效的Token", HttpStatus.NOT_FOUND);
    }

    if (feedbackToken.isUsed) {
      throw new HttpException("该反馈已提交", HttpStatus.BAD_REQUEST);
    }

    if (new Date(feedbackToken.expiresAt) < new Date()) {
      throw new HttpException("Token已过期", HttpStatus.BAD_REQUEST);
    }

    // 校验面试状态
    const interview = await this.prisma.interview.findUnique({
      where: { id: feedbackToken.interviewId },
    });

    if (!interview) {
      throw new HttpException("面试不存在", HttpStatus.NOT_FOUND);
    }

    if (interview.status === "CANCELLED") {
      throw new HttpException("该面试已取消", HttpStatus.BAD_REQUEST);
    }

    // 事务保护：feedback + interview 状态更新原子化
    const feedback = await this.prisma.$transaction(async (tx) => {
      const fb = await tx.interviewFeedback.create({
        data: {
          interviewId: feedbackToken.interviewId,
          interviewerId: feedbackToken.interviewerId,
          result: body.result,
          strengths: body.strengths,
          weaknesses: body.weaknesses,
          overallRating: body.overallRating,
          notes: body.notes,
        },
      });

      await tx.feedbackToken.update({
        where: { token: body.token },
        data: { isUsed: true, usedAt: new Date() },
      });

      if (body.result !== "PENDING") {
        await tx.interview.update({
          where: { id: feedbackToken.interviewId },
          data: { status: "COMPLETED" },
        });
      }

      return fb;
    });

    // 旁路操作：候选人状态更新 + 流程通知（事务外）
    let statusUpdate = null;
    try {
      const result = await this.candidateStatusService.handleInterviewFeedback(
        feedbackToken.interviewId,
        body.result,
      );
      if (result && typeof result === "object" && "statusHistory" in result) {
        statusUpdate = (result as any).statusHistory;
      }
    } catch (error) {
      console.error("Failed to update candidate status:", error);
    }

    // 触发流程状态更新（之前缺失的关键步骤）
    if (body.result !== "PENDING" && interview.processId && interview.roundNumber) {
      try {
        await this.processService.onInterviewCompleted(
          interview.processId,
          interview.roundNumber,
        );
      } catch (error) {
        console.error("流程状态更新通知失败:", error);
      }
    }

    return {
      success: true,
      feedback,
      statusUpdate,
      message: "反馈提交成功",
    };
  }
}
