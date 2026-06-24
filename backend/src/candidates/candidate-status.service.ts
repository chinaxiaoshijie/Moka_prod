import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export const CANDIDATE_STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["SCREENING", "INTERVIEW_1", "REJECTED"],
  SCREENING: ["INTERVIEW_1", "REJECTED"],
  INTERVIEW_1: ["INTERVIEW_2", "INTERVIEW_3", "HIRED", "REJECTED"],
  INTERVIEW_2: ["INTERVIEW_3", "HIRED", "REJECTED"],
  INTERVIEW_3: ["HIRED", "REJECTED"],
  HIRED: [],
  REJECTED: [],
};

export const STATUS_DISPLAY_MAP: Record<string, string> = {
  PENDING: "待处理",
  SCREENING: "筛选中",
  INTERVIEW_1: "初试",
  INTERVIEW_2: "复试",
  INTERVIEW_3: "终试",
  HIRED: "已录用",
  REJECTED: "已淘汰",
};

@Injectable()
export class CandidateStatusService {
  constructor(private prisma: PrismaService) {}

  canTransition(fromStatus: string, toStatus: string): boolean {
    const allowedTransitions = CANDIDATE_STATUS_TRANSITIONS[fromStatus] || [];
    return allowedTransitions.includes(toStatus);
  }

  getAllowedTransitions(currentStatus: string): string[] {
    return CANDIDATE_STATUS_TRANSITIONS[currentStatus] || [];
  }

  getNextInterviewStatus(currentStatus: string): string | null {
    const statusFlow = [
      "PENDING",
      "SCREENING",
      "INTERVIEW_1",
      "INTERVIEW_2",
      "INTERVIEW_3",
      "HIRED",
    ];
    const currentIndex = statusFlow.indexOf(currentStatus);

    if (currentIndex === -1 || currentIndex >= statusFlow.length - 2) {
      return null;
    }

    return statusFlow[currentIndex + 1];
  }

  async updateCandidateStatus(
    candidateId: string,
    newStatus: string,
    changedBy?: string,
    reason?: string,
    relatedInterviewId?: string,
  ) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      throw new Error("候选人不存在");
    }

    const currentStatus = candidate.status;

    if (!this.canTransition(currentStatus, newStatus)) {
      throw new Error(
        `无法从状态 "${STATUS_DISPLAY_MAP[currentStatus]}" 转换为 "${STATUS_DISPLAY_MAP[newStatus]}"`,
      );
    }

    const updatedCandidate = await this.prisma.candidate.update({
      where: { id: candidateId },
      data: { status: newStatus as any },
    });

    await this.prisma.candidateStatusHistory.create({
      data: {
        candidateId,
        oldStatus: currentStatus as any,
        newStatus: newStatus as any,
        changedBy,
        reason,
        relatedInterviewId,
      },
    });

    return {
      candidate: updatedCandidate,
      statusHistory: {
        oldStatus: currentStatus,
        newStatus,
      },
    };
  }

  async handleInterviewFeedback(
    interviewId: string,
    feedbackResult: "PASS" | "FAIL" | "PENDING",
  ) {
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        candidate: true,
        process: true,
      },
    });

    if (!interview) {
      throw new Error("面试不存在");
    }

    const candidate = interview.candidate;
    const currentStatus = candidate.status;

    if (feedbackResult === "FAIL") {
      return await this.updateCandidateStatus(
        candidate.id,
        "REJECTED",
        interview.interviewerId,
        `面试失败 - ${interview.type}`,
        interviewId,
      );
    }

    if (feedbackResult === "PENDING") {
      return { candidate, message: "待定，不更新状态" };
    }

    if (feedbackResult === "PASS") {
      const nextStatus = this.getNextInterviewStatus(currentStatus);

      if (!nextStatus) {
        return { candidate, message: "已是最后一轮面试" };
      }

      return await this.updateCandidateStatus(
        candidate.id,
        nextStatus,
        interview.interviewerId,
        `面试通过 - ${interview.type}`,
        interviewId,
      );
    }

    return { candidate };
  }
}
