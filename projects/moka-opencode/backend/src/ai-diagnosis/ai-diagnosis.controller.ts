import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseIntPipe,
  HttpException,
  HttpStatus,
  UseGuards,
  Request,
  Logger,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiParam, ApiBody } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { PrismaService } from "../prisma/prisma.service";
import { AIDiagnosisService, AIDiagnosisResult } from "./ai-diagnosis.service";
import { EmailService } from "../email/email.service";
import {
  TriggerDiagnosisResponseDto,
  ShareDiagnosisDto,
  ShareDiagnosisResponseDto,
} from "./dto/ai-diagnosis.dto";

@ApiTags("ai-diagnosis")
@Controller("interview-processes/:processId/rounds/:roundNumber/ai-diagnosis")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AIDiagnosisController {
  private readonly logger = new Logger(AIDiagnosisController.name);

  constructor(
    private prisma: PrismaService,
    private aiDiagnosisService: AIDiagnosisService,
    private emailService: EmailService,
  ) {}

  /**
   * POST / - 触发 AI 诊断分析
   * - HR轮：获取候选人简历+职位要求，调用 generateHRDiagnosis
   * - 后续轮：获取前轮反馈，调用 generateRoundDiagnosis
   * - 保存到 AIDiagnosis 表
   */
  @Post()
  @Roles("HR", "INTERVIEWER")
  @ApiOperation({ summary: "触发 AI 诊断分析" })
  @ApiParam({ name: "processId", description: "面试流程ID" })
  @ApiParam({ name: "roundNumber", description: "轮次编号", type: Number })
  async triggerDiagnosis(
    @Param("processId") processId: string,
    @Param("roundNumber", ParseIntPipe) roundNumber: number,
  ): Promise<TriggerDiagnosisResponseDto> {
    // 1. 获取面试流程信息（含候选人、职位、轮次配置）
    const process = await this.prisma.interviewProcess.findUnique({
      where: { id: processId },
      include: {
        candidate: {
          include: {
            resumeFiles: {
              where: { isActive: true },
              orderBy: { uploadedAt: "desc" },
            },
          },
        },
        position: true,
        rounds: {
          orderBy: { roundNumber: "asc" },
        },
        interviews: {
          where: { roundNumber: { lt: roundNumber } },
          include: {
            feedbacks: true,
          },
          orderBy: { roundNumber: "asc" },
        },
      },
    });

    if (!process) {
      throw new NotFoundException("面试流程不存在");
    }

    const roundConfig = process.rounds.find(
      (r) => r.roundNumber === roundNumber,
    );
    if (!roundConfig) {
      throw new BadRequestException(`第${roundNumber}轮未配置`);
    }

    const isHRRound = roundConfig.isHRRound || roundNumber === 1;

    let diagnosisResult: AIDiagnosisResult;

    if (isHRRound) {
      // === HR轮：获取简历 + 职位要求 ===
      const resumeText = await this.getResumeText(process.candidate);

      if (!resumeText) {
        throw new BadRequestException("候选人暂无简历，无法进行AI诊断");
      }

      this.logger.log(
        `HR轮诊断 - processId=${processId}, round=${roundNumber}, candidate=${process.candidate.name}`,
      );

      diagnosisResult = await this.aiDiagnosisService.generateHRDiagnosis(
        resumeText,
        process.position.title,
        process.position.description || "",
        process.position.requirements || "",
      );
    } else {
      // === 后续轮：获取前轮反馈 ===
      const previousFeedbacks = this.buildPreviousFeedbacks(process.interviews);

      if (!previousFeedbacks) {
        throw new BadRequestException("暂无前轮反馈，无法进行AI诊断");
      }

      this.logger.log(
        `第${roundNumber}轮诊断 - processId=${processId}, candidate=${process.candidate.name}`,
      );

      diagnosisResult = await this.aiDiagnosisService.generateRoundDiagnosis(
        previousFeedbacks,
        process.position.title,
        process.position.requirements || "",
        roundNumber,
        roundConfig.roundType,
      );
    }

    // 2. 保存到 AIDiagnosis 表（upsert）
    const saved = await this.prisma.aIDiagnosis.upsert({
      where: {
        processId_roundNumber: {
          processId,
          roundNumber,
        },
      },
      create: {
        processId,
        roundNumber,
        positionId: process.positionId,
        matchScore: diagnosisResult.matchScore,
        matchLevel: diagnosisResult.matchLevel,
        strengths: diagnosisResult.strengths,
        weaknesses: diagnosisResult.weaknesses,
        suggestions: diagnosisResult.suggestions,
        questions: diagnosisResult.questions,
        summary: diagnosisResult.summary,
        rawOutput: JSON.stringify(diagnosisResult),
        inputSnapshot: {
          isHRRound,
          candidateId: process.candidateId,
          positionId: process.positionId,
          roundNumber,
        },
      },
      update: {
        matchScore: diagnosisResult.matchScore,
        matchLevel: diagnosisResult.matchLevel,
        strengths: diagnosisResult.strengths,
        weaknesses: diagnosisResult.weaknesses,
        suggestions: diagnosisResult.suggestions,
        questions: diagnosisResult.questions,
        summary: diagnosisResult.summary,
        rawOutput: JSON.stringify(diagnosisResult),
        analyzedAt: new Date(),
      },
    });

    this.logger.log(
      `AI诊断已保存 - diagnosisId=${saved.id}, processId=${processId}, round=${roundNumber}`,
    );

    return this.mapToResponseDto(saved);
  }

  /**
   * GET / - 获取诊断结果
   */
  @Get()
  @Roles("HR", "INTERVIEWER")
  @ApiOperation({ summary: "获取 AI 诊断结果" })
  @ApiParam({ name: "processId", description: "面试流程ID" })
  @ApiParam({ name: "roundNumber", description: "轮次编号", type: Number })
  async getDiagnosis(
    @Param("processId") processId: string,
    @Param("roundNumber", ParseIntPipe) roundNumber: number,
  ): Promise<TriggerDiagnosisResponseDto | null> {
    const diagnosis = await this.prisma.aIDiagnosis.findUnique({
      where: {
        processId_roundNumber: {
          processId,
          roundNumber,
        },
      },
    });

    if (!diagnosis) {
      return null;
    }

    return this.mapToResponseDto(diagnosis);
  }

  /**
   * POST /share - 邮件分享诊断给面试官
   */
  @Post("share")
  @Roles("HR")
  @ApiOperation({ summary: "邮件分享 AI 诊断给面试官" })
  @ApiParam({ name: "processId", description: "面试流程ID" })
  @ApiParam({ name: "roundNumber", description: "轮次编号", type: Number })
  @ApiBody({ type: ShareDiagnosisDto })
  async shareDiagnosis(
    @Param("processId") processId: string,
    @Param("roundNumber", ParseIntPipe) roundNumber: number,
    @Body() shareDto: ShareDiagnosisDto,
  ): Promise<ShareDiagnosisResponseDto> {
    // 1. 获取诊断结果
    const diagnosis = await this.prisma.aIDiagnosis.findUnique({
      where: {
        processId_roundNumber: {
          processId,
          roundNumber,
        },
      },
    });

    if (!diagnosis) {
      throw new NotFoundException("暂无AI诊断结果，请先触发诊断分析");
    }

    // 2. 获取面试官信息
    const interviewer = await this.prisma.user.findUnique({
      where: { id: shareDto.interviewerId },
    });

    if (!interviewer) {
      throw new BadRequestException("面试官不存在");
    }

    if (!interviewer.email) {
      throw new BadRequestException("该面试官未配置邮箱");
    }

    // 3. 获取流程和候选人信息
    const process = await this.prisma.interviewProcess.findUnique({
      where: { id: processId },
      include: {
        candidate: true,
        position: true,
      },
    });

    if (!process) {
      throw new NotFoundException("面试流程不存在");
    }

    // 4. 生成邮件内容
    const roundConfig = await this.prisma.interviewRound.findFirst({
      where: { processId, roundNumber },
    });

    const roundTypeText =
      roundConfig?.roundType === "HR_SCREENING"
        ? "HR初筛"
        : roundConfig?.roundType === "TECHNICAL"
          ? "技术面"
          : roundConfig?.roundType === "FINAL"
            ? "终面"
            : `第${roundNumber}轮`;

    const emailContent = this.buildDiagnosisEmail(
      interviewer.name,
      process.candidate.name,
      process.position.title,
      roundNumber,
      roundTypeText,
      diagnosis,
      shareDto.customMessage,
    );

    const subject = `AI诊断分析 - ${process.candidate.name} - ${process.position.title} 第${roundNumber}轮`;

    // 5. 发送邮件
    try {
      await this.emailService.sendCustomEmail({
        to: interviewer.email,
        subject,
        content: emailContent,
      });

      this.logger.log(
        `AI诊断邮件已发送 - interviewerId=${shareDto.interviewerId}, processId=${processId}, round=${roundNumber}`,
      );

      return {
        success: true,
        recipientEmail: interviewer.email,
      };
    } catch (error) {
      this.logger.error(
        `AI诊断邮件发送失败 - interviewerId=${shareDto.interviewerId}`,
        error as Error,
      );
      throw new HttpException(
        "邮件发送失败: " + (error instanceof Error ? error.message : String(error)),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================== 内部方法 ====================

  /**
   * 获取候选人简历文本
   */
  private async getResumeText(candidate: any): Promise<string | null> {
    // 优先使用活跃的简历文件
    if (candidate.resumeFiles && candidate.resumeFiles.length > 0) {
      const activeResume = candidate.resumeFiles[0];
      try {
        const fs = await import("fs");
        if (fs.existsSync(activeResume.filePath)) {
          const buffer = fs.readFileSync(activeResume.filePath);
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const pdfParse = require("pdf-parse");
          const data = await pdfParse(buffer);
          return data.text;
        }
      } catch (error) {
        this.logger.warn(
          `简历文件解析失败 - resumeId=${activeResume.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    // 兜底：使用候选人记录的 resumeUrl（如果有文本内容的话）
    return null;
  }

  /**
   * 构建前轮反馈摘要
   */
  private buildPreviousFeedbacks(interviews: any[]): string | null {
    if (!interviews || interviews.length === 0) {
      return null;
    }

    const parts: string[] = [];

    for (const interview of interviews) {
      if (!interview.feedbacks || interview.feedbacks.length === 0) {
        continue;
      }

      const roundNum = interview.roundNumber || "?";
      for (const fb of interview.feedbacks) {
        const interviewerName = fb.interviewer?.name || "未知面试官";
        let feedbackText = `第${roundNum}轮 - ${interviewerName}：\n`;
        feedbackText += `结论：${fb.result}\n`;
        if (fb.overallRating) {
          feedbackText += `评分：${fb.overallRating}/5\n`;
        }
        if (fb.strengths) {
          feedbackText += `优势：${fb.strengths}\n`;
        }
        if (fb.weaknesses) {
          feedbackText += `不足：${fb.weaknesses}\n`;
        }
        if (fb.notes) {
          feedbackText += `评语：${fb.notes}\n`;
        }
        parts.push(feedbackText.trim());
      }
    }

    return parts.length > 0 ? parts.join("\n\n") : null;
  }

  /**
   * 构建诊断邮件 HTML 内容
   */
  private buildDiagnosisEmail(
    interviewerName: string,
    candidateName: string,
    positionTitle: string,
    roundNumber: number,
    roundTypeText: string,
    diagnosis: any,
    customMessage?: string,
  ): string {
    const matchScoreBadge =
      diagnosis.matchScore !== null && diagnosis.matchScore !== undefined
        ? `<div style="background: ${this.getMatchScoreColor(diagnosis.matchScore)}; color: white; padding: 4px 12px; border-radius: 12px; display: inline-block; font-size: 14px; font-weight: bold;">匹配度 ${diagnosis.matchScore}%</div>`
        : "";

    return `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">AI 诊断分析报告</h2>
  <p>${interviewerName} 您好：</p>
  <p>以下是候选人 <strong>${candidateName}</strong>（应聘 ${positionTitle}）第${roundNumber}轮（${roundTypeText}）的 AI 诊断分析结果：</p>

  ${matchScoreBadge ? `<div style="margin: 15px 0;">${matchScoreBadge}</div>` : ""}

  ${customMessage ? `<div style="background: #fff3cd; padding: 12px; border-radius: 6px; margin: 15px 0;"><strong>HR留言：</strong>${customMessage}</div>` : ""}

  ${diagnosis.summary ? `
  <div style="background: #f0f7ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
    <h3 style="margin-top: 0; color: #1a73e8;">📋 摘要</h3>
    <p>${diagnosis.summary}</p>
  </div>` : ""}

  ${diagnosis.strengths && diagnosis.strengths.length > 0 ? `
  <div style="background: #f0fff4; padding: 15px; border-radius: 8px; margin: 15px 0;">
    <h3 style="margin-top: 0; color: #38a169;">✅ 候选人优势</h3>
    <ul style="margin: 0; padding-left: 20px;">
      ${diagnosis.strengths.map((s: string) => `<li>${s}</li>`).join("")}
    </ul>
  </div>` : ""}

  ${diagnosis.weaknesses && diagnosis.weaknesses.length > 0 ? `
  <div style="background: #fff5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
    <h3 style="margin-top: 0; color: #e53e3e;">⚠️ 不足/风险点</h3>
    <ul style="margin: 0; padding-left: 20px;">
      ${diagnosis.weaknesses.map((w: string) => `<li>${w}</li>`).join("")}
    </ul>
  </div>` : ""}

  ${diagnosis.suggestions && diagnosis.suggestions.length > 0 ? `
  <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
    <h3 style="margin-top: 0; color: #666;">💡 面试建议</h3>
    <ul style="margin: 0; padding-left: 20px;">
      ${diagnosis.suggestions.map((s: string) => `<li>${s}</li>`).join("")}
    </ul>
  </div>` : ""}

  ${diagnosis.questions && diagnosis.questions.length > 0 ? `
  <div style="background: #fefce8; padding: 15px; border-radius: 8px; margin: 15px 0;">
    <h3 style="margin-top: 0; color: #ca8a04;">❓ 建议面试问题</h3>
    <ol style="margin: 0; padding-left: 20px;">
      ${diagnosis.questions.map((q: string) => `<li>${q}</li>`).join("")}
    </ol>
  </div>` : ""}

  <p style="color: #999; margin-top: 30px; font-size: 12px;">
    本报告由 AI 自动生成，仅供参考。分析时间：${new Date(diagnosis.analyzedAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}
  </p>
  <p style="color: #999; margin-top: 10px;">码隆智能面试系统</p>
</div>
    `.trim();
  }

  /**
   * 根据匹配度获取颜色
   */
  private getMatchScoreColor(score: number): string {
    if (score >= 80) return "#38a169"; // green
    if (score >= 60) return "#ca8a04"; // yellow
    return "#e53e3e"; // red
  }

  /**
   * 映射到 Response DTO
   */
  private mapToResponseDto(diagnosis: any): TriggerDiagnosisResponseDto {
    return {
      id: diagnosis.id,
      processId: diagnosis.processId,
      roundNumber: diagnosis.roundNumber,
      matchScore: diagnosis.matchScore,
      matchLevel: diagnosis.matchLevel,
      strengths: diagnosis.strengths || [],
      weaknesses: diagnosis.weaknesses || [],
      suggestions: diagnosis.suggestions || [],
      questions: diagnosis.questions || [],
      summary: diagnosis.summary || "",
      analyzedAt: diagnosis.analyzedAt,
    };
  }
}
