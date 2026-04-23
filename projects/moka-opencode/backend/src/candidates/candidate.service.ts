import "multer";
import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import {
  CreateCandidateDto,
  UpdateCandidateDto,
  CandidateResponseDto,
  CandidateListResponseDto,
} from "./dto/candidate.dto";

@Injectable()
export class CandidateService {
  private readonly logger = new Logger(CandidateService.name);
  
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  // ✅ 仅限 HR 角色进行写操作（创建/更新/删除/简历管理）
  checkHROnly(userRole?: string) {
    if (userRole !== "HR") {
      throw new Error("仅 HR 可执行此操作");
    }
  }

  // ✅ 检查用户对候选人的访问权限（面试官只能访问自己有面试安排的候选人）
  private async checkCandidateAccess(candidateId: string, userId?: string, userRole?: string) {
    if (userRole === "INTERVIEWER" && userId) {
      const hasAccess = await this.prisma.interview.findFirst({
        where: { candidateId, interviewerId: userId },
        select: { id: true },
      });
      if (!hasAccess) {
        throw new Error("无权查看该候选人信息");
      }
    }
  }

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
    userId?: string,
    userRole?: string,
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

    // ✅ 角色权限过滤：面试官只能看到自己有面试安排的候选人
    if (userRole === "INTERVIEWER" && userId) {
      where.interviews = {
        some: { interviewerId: userId },
      };
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

  async findOne(id: string, userId?: string, userRole?: string): Promise<CandidateResponseDto> {
    if (!/^[a-zA-Z0-9-]+$/.test(id)) {
      throw new Error("无效的候选人 ID 格式");
    }

    const candidate = await this.prisma.candidate.findUnique({
      where: { id },
      include: { position: true },
    });

    if (!candidate) {
      throw new Error("候选人不存在");
    }

    // ✅ 角色权限校验：面试官只能查看自己有面试安排的候选人
    if (userRole === "INTERVIEWER" && userId) {
      const hasAccess = await this.prisma.interview.findFirst({
        where: {
          candidateId: id,
          interviewerId: userId,
        },
        select: { id: true },
      });
      if (!hasAccess) {
        throw new Error("无权查看该候选人信息");
      }
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
    // 验证 candidateId 格式，防止路径遍历攻击
    if (!/^[a-zA-Z0-9-]+$/.test(candidateId)) {
      throw new Error("无效的候选人 ID 格式");
    }

    // 验证文件存在性（在事务外）
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
    // 使用安全文件名存储（避免中文乱码和特殊字符问题）
    const safeFileName = `${candidateId}_${timestamp}.pdf`;
    const filePath = path.join(uploadDir, safeFileName);

    fs.writeFileSync(filePath, file.buffer);

    // fileUrl 不再使用，前端直接使用 resumeId
    const fileUrl = `/candidates/resumes/${candidateId}`;

    // 使用事务保护多个数据库操作
    const resumeFile = await this.prisma.$transaction(async (tx) => {
      const createdResume = await tx.resumeFile.create({
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

      // 将该候选人的其他简历设为非活跃
      await tx.resumeFile.updateMany({
        where: {
          candidateId,
          id: { not: createdResume.id },
        },
        data: { isActive: false },
      });

      // 更新候选人的 resumeUrl
      await tx.candidate.update({
        where: { id: candidateId },
        data: { resumeUrl: fileUrl },
      });

      return createdResume;
    });

    this.logger.log(`简历上传成功：candidateId=${candidateId}, fileName=${file.originalname}`);
    return resumeFile;
  }

  async getResumes(candidateId: string, userId?: string, userRole?: string) {
    await this.checkCandidateAccess(candidateId, userId, userRole);

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
    // 验证 resumeId 格式，防止路径遍历攻击
    if (!/^[a-zA-Z0-9-]+$/.test(resumeId)) {
      throw new Error("无效的简历 ID 格式");
    }

    const resume = await this.prisma.resumeFile.findUnique({
      where: { id: resumeId },
    });

    if (!resume) {
      throw new Error("简历文件不存在");
    }

    // 验证文件路径安全性，确保文件在允许的目录内
    const path = await import("path");
    const uploadDir = path.join(process.cwd(), "uploads", "resumes");
    const normalizedPath = path.normalize(resume.filePath);
    if (!normalizedPath.startsWith(uploadDir)) {
      throw new Error("非法的文件路径");
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

    // 发送@通知邮件给面试官
    if (mention.interviewer.email) {
      try {
        await this.emailService.sendMentionNotification({
          interviewerName: mention.interviewer.name,
          interviewerEmail: mention.interviewer.email,
          candidateName: mention.candidate.name,
          mentionedByName: mention.mentionedBy.name,
          message,
          candidateId,
        });
        this.logger.log(`@通知邮件发送成功：interviewerId=${interviewerId}, candidateId=${candidateId}`);
      } catch (error) {
        this.logger.error(`@通知邮件发送失败：interviewerId=${interviewerId}, candidateId=${candidateId}`, error as Error);
      }
    }

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

  async getStatusHistory(candidateId: string, userId?: string, userRole?: string) {
    await this.checkCandidateAccess(candidateId, userId, userRole);

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
