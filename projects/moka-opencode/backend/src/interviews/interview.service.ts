import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../email/email.service";
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
  ) {}

  async create(createDto: CreateInterviewDto): Promise<InterviewResponseDto> {
    const interview = await this.prisma.interview.create({
      data: {
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
      include: {
        candidate: true,
        position: true,
        interviewer: true,
      },
    });

    // 仅发送给面试官，不自动发送给候选人
    if (interview.interviewer.email) {
      await this.emailService.sendInterviewNotificationToInterviewer({
        candidateName: interview.candidate.name,
        candidateEmail: interview.candidate.email || "",
        positionTitle: interview.position.title,
        interviewerName: interview.interviewer.name,
        interviewerEmail: interview.interviewer.email,
        startTime: interview.startTime,
        endTime: interview.endTime,
        format: interview.format,
        location: interview.location || undefined,
        meetingUrl: interview.meetingUrl || undefined,
        meetingNumber: interview.meetingNumber || undefined,
      });
    }

    return this.mapToResponseDto(interview);
  }

  async sendCandidateEmail(
    interviewId: string,
    customSubject?: string,
    customContent?: string,
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

      return { message: "邮件已成功发送" };
    } catch (error) {
      console.error("发送邮件给候选人失败:", error);
      return { message: `邮件发送失败: ${(error as Error).message}` };
    }
  }

  async findAll(
    page: number = 1,
    pageSize: number = 100,
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

  private mapToResponseDto(interview: any): InterviewResponseDto {
    return {
      id: interview.id,
      candidateId: interview.candidateId,
      candidate: {
        name: interview.candidate.name,
        phone: interview.candidate.phone,
      },
      positionId: interview.positionId,
      position: { title: interview.position.title },
      interviewerId: interview.interviewerId,
      interviewer: { name: interview.interviewer.name },
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
