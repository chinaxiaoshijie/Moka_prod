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
        status: "SCHEDULED",
      },
      include: {
        candidate: true,
        position: true,
        interviewer: true,
      },
    });

    if (interview.candidate.email) {
      await this.emailService.sendInterviewNotificationToCandidate({
        candidateName: interview.candidate.name,
        candidateEmail: interview.candidate.email,
        positionTitle: interview.position.title,
        interviewerName: interview.interviewer.name,
        interviewerEmail: interview.interviewer.email || "",
        startTime: interview.startTime,
        endTime: interview.endTime,
        format: interview.format,
        location: interview.location || undefined,
        meetingUrl: interview.meetingUrl || undefined,
        meetingNumber: interview.meetingNumber || undefined,
      });
    }

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

  async findAll(
    page: number = 1,
    pageSize: number = 10,
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
