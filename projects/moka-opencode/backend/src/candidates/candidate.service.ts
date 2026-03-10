import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateCandidateDto,
  UpdateCandidateDto,
  CandidateResponseDto,
  CandidateListResponseDto,
} from "./dto/candidate.dto";

@Injectable()
export class CandidateService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateCandidateDto): Promise<CandidateResponseDto> {
    const candidate = await this.prisma.candidate.create({
      data: {
        name: createDto.name,
        phone: createDto.phone,
        email: createDto.email,
        positionId: createDto.positionId,
        status: createDto.status || "PENDING",
        source: createDto.source,
        resumeUrl: createDto.resumeUrl,
      },
      include: { position: true },
    });

    return this.mapToResponseDto(candidate);
  }

  async findAll(
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    status?: string,
    positionId?: string,
  ): Promise<CandidateListResponseDto> {
    const skip = (page - 1) * pageSize;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (positionId) {
      where.positionId = positionId;
    }

    const [items, total] = await Promise.all([
      this.prisma.candidate.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: { position: true },
      }),
      this.prisma.candidate.count({ where }),
    ]);

    return {
      items: items.map((item) => this.mapToResponseDto(item)),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string): Promise<CandidateResponseDto> {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id },
      include: { position: true },
    });

    if (!candidate) {
      throw new Error("候选人不存在");
    }

    return this.mapToResponseDto(candidate);
  }

  async update(
    id: string,
    updateDto: UpdateCandidateDto,
  ): Promise<CandidateResponseDto> {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id },
    });

    if (!candidate) {
      throw new Error("候选人不存在");
    }

    const updatedCandidate = await this.prisma.candidate.update({
      where: { id },
      data: updateDto,
      include: { position: true },
    });

    return this.mapToResponseDto(updatedCandidate);
  }

  async remove(id: string): Promise<CandidateResponseDto> {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id },
    });

    if (!candidate) {
      throw new Error("候选人不存在");
    }

    const deletedCandidate = await this.prisma.candidate.delete({
      where: { id },
      include: { position: true },
    });

    return this.mapToResponseDto(deletedCandidate);
  }

  private mapToResponseDto(candidate: any): CandidateResponseDto {
    return {
      id: candidate.id,
      name: candidate.name,
      phone: candidate.phone,
      email: candidate.email,
      positionId: candidate.positionId,
      position: candidate.position ? { title: candidate.position.title } : null,
      status: candidate.status,
      source: candidate.source,
      resumeUrl: candidate.resumeUrl,
      createdAt: candidate.createdAt,
      updatedAt: candidate.updatedAt,
    };
  }

  async uploadResume(
    candidateId: string,
    file: Express.Multer.File,
    uploadedBy?: string,
  ) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      throw new Error("候选人不存在");
    }

    const fs = await import("fs");
    const path = await import("path");

    const uploadDir = path.join(process.cwd(), "uploads", "resumes");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const timestamp = Date.now();
    const safeFileName = file.originalname.replace(/[^a-zA-Z0-9.]/g, "_");
    const fileName = `${candidateId}_${timestamp}_${safeFileName}`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, file.buffer);

    const fileUrl = `/candidates/resumes/file/${fileName}`;

    const resumeFile = await this.prisma.resumeFile.create({
      data: {
        candidateId,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        filePath,
        fileUrl,
        uploadedBy,
        isActive: true,
      },
    });

    await this.prisma.resumeFile.updateMany({
      where: {
        candidateId,
        id: { not: resumeFile.id },
      },
      data: { isActive: false },
    });

    await this.prisma.candidate.update({
      where: { id: candidateId },
      data: { resumeUrl: fileUrl },
    });

    return resumeFile;
  }

  async getResumes(candidateId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      throw new Error("候选人不存在");
    }

    const resumes = await this.prisma.resumeFile.findMany({
      where: { candidateId },
      orderBy: { uploadedAt: "desc" },
      include: {
        uploadedByUser: {
          select: { name: true, email: true },
        },
      },
    });

    return resumes;
  }

  async getResumeFile(resumeId: string) {
    const resume = await this.prisma.resumeFile.findUnique({
      where: { id: resumeId },
    });

    if (!resume) {
      throw new Error("简历文件不存在");
    }

    return resume;
  }

  async deleteResume(resumeId: string) {
    const resume = await this.prisma.resumeFile.findUnique({
      where: { id: resumeId },
    });

    if (!resume) {
      throw new Error("简历文件不存在");
    }

    const fs = await import("fs");
    if (fs.existsSync(resume.filePath)) {
      fs.unlinkSync(resume.filePath);
    }

    await this.prisma.resumeFile.delete({
      where: { id: resumeId },
    });

    if (resume.isActive) {
      const latestResume = await this.prisma.resumeFile.findFirst({
        where: { candidateId: resume.candidateId },
        orderBy: { uploadedAt: "desc" },
      });

      await this.prisma.candidate.update({
        where: { id: resume.candidateId },
        data: { resumeUrl: latestResume?.fileUrl || null },
      });
    }

    return { success: true };
  }

  async activateResume(resumeId: string, candidateId: string) {
    const resume = await this.prisma.resumeFile.findUnique({
      where: { id: resumeId },
    });

    if (!resume || resume.candidateId !== candidateId) {
      throw new Error("简历文件不存在");
    }

    await this.prisma.resumeFile.updateMany({
      where: { candidateId },
      data: { isActive: false },
    });

    await this.prisma.resumeFile.update({
      where: { id: resumeId },
      data: { isActive: true },
    });

    await this.prisma.candidate.update({
      where: { id: candidateId },
      data: { resumeUrl: resume.fileUrl },
    });

    return { success: true };
  }

  async checkDuplicate(
    name: string,
    phone: string,
    excludeId?: string,
  ): Promise<{
    isDuplicate: boolean;
    existingCandidate?: any;
  }> {
    const where: any = {
      name,
      phone,
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const existing = await this.prisma.candidate.findFirst({
      where,
      include: { position: true },
    });

    if (existing) {
      return {
        isDuplicate: true,
        existingCandidate: this.mapToResponseDto(existing),
      };
    }

    return { isDuplicate: false };
  }

  async mentionInterviewer(
    candidateId: string,
    interviewerId: string,
    mentionedBy: string,
    message?: string,
  ) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      throw new Error("候选人不存在");
    }

    const interviewer = await this.prisma.user.findUnique({
      where: { id: interviewerId },
    });

    if (!interviewer) {
      throw new Error("面试官不存在");
    }

    const mention = await this.prisma.candidateMention.create({
      data: {
        candidateId,
        interviewerId,
        mentionedById: mentionedBy,
        message,
        status: "PENDING",
      },
      include: {
        candidate: true,
        interviewer: {
          select: { id: true, name: true, email: true },
        },
        mentionedBy: {
          select: { id: true, name: true },
        },
      },
    });

    return mention;
  }

  async getMentions(candidateId: string) {
    const mentions = await this.prisma.candidateMention.findMany({
      where: { candidateId },
      orderBy: { createdAt: "desc" },
      include: {
        interviewer: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        mentionedBy: {
          select: { id: true, name: true },
        },
      },
    });

    return mentions;
  }

  async getMentionsByInterviewer(interviewerId: string, status?: string) {
    const where: any = { interviewerId };

    if (status) {
      where.status = status;
    }

    const mentions = await this.prisma.candidateMention.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        candidate: {
          include: { position: true },
        },
        mentionedBy: {
          select: { id: true, name: true },
        },
      },
    });

    return mentions;
  }

  async viewMention(mentionId: string) {
    const mention = await this.prisma.candidateMention.update({
      where: { id: mentionId },
      data: {
        status: "VIEWED",
        viewedAt: new Date(),
      },
    });

    return mention;
  }

  async respondMention(mentionId: string, suitable: boolean, comment?: string) {
    const mention = await this.prisma.candidateMention.update({
      where: { id: mentionId },
      data: {
        status: "RESPONDED",
        viewedAt: new Date(),
      },
    });

    return {
      mention,
      response: {
        suitable,
        comment,
      },
    };
  }

  async getStatusHistory(candidateId: string) {
    const history = await this.prisma.candidateStatusHistory.findMany({
      where: { candidateId },
      orderBy: { createdAt: "desc" },
      include: {
        changedByUser: {
          select: { id: true, name: true },
        },
      },
    });

    return history;
  }

  async logStatusChange(
    candidateId: string,
    oldStatus: string | null,
    newStatus: string,
    changedBy?: string,
    reason?: string,
    relatedInterviewId?: string,
  ) {
    await this.prisma.candidateStatusHistory.create({
      data: {
        candidateId,
        oldStatus: oldStatus as any,
        newStatus: newStatus as any,
        changedBy,
        reason,
        relatedInterviewId,
      },
    });
  }
}
