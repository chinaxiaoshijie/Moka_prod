import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { TriggerDiagnosisResponseDto } from "./dto/ai-diagnosis.dto";

export interface AIDiagnosisResult {
  matchScore?: number;
  matchLevel?: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  questions: string[];
  summary: string;
}

export type DiagnosisRoundType = "first" | "second" | "final";

const DEFAULT_RESULT: AIDiagnosisResult = {
  strengths: [],
  weaknesses: [],
  suggestions: [],
  questions: [],
  summary: "AI诊断服务暂时不可用，请稍后重试。",
};

@Injectable()
export class AIDiagnosisService {
  private readonly logger = new Logger(AIDiagnosisService.name);
  private readonly apiKey: string;
  private readonly apiBase = "https://dashscope.aliyuncs.com/compatible-mode/v1";
  private readonly model = "qwen-plus";

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.apiKey =
      this.configService.get<string>("DASHSCOPE_API_KEY") ||
      "sk-4ac...e257";
  }

  /**
   * HR轮诊断：基于简历 + 岗位信息生成分析
   */
  async generateHRDiagnosis(
    resumeText: string,
    positionTitle: string,
    positionDescription: string,
    positionRequirements: string,
  ): Promise<AIDiagnosisResult> {
    const prompt = this.buildHRPrompt(
      resumeText,
      positionTitle,
      positionDescription,
      positionRequirements,
    );

    return this.callAI(prompt, "HR轮诊断");
  }

  /**
   * 后续轮次诊断：基于前轮反馈 + 岗位信息生成分析
   */
  async generateRoundDiagnosis(
    previousFeedbacks: string,
    positionTitle: string,
    positionRequirements: string,
    roundNumber: number,
    roundType: string,
  ): Promise<AIDiagnosisResult> {
    const prompt = this.buildRoundPrompt(
      previousFeedbacks,
      positionTitle,
      positionRequirements,
      roundNumber,
      roundType,
    );

    return this.callAI(prompt, `第${roundNumber}轮${roundType}诊断`);
  }

  /**
   * 第二轮诊断：基于简历 + 岗位 + 第一轮面试官评价
   */
  async generateSecondRoundDiagnosis(
    resumeText: string,
    positionTitle: string,
    positionRequirements: string,
    firstRoundFeedback: string,
  ): Promise<AIDiagnosisResult> {
    const prompt = this.buildSecondRoundPrompt(
      resumeText,
      positionTitle,
      positionRequirements,
      firstRoundFeedback,
    );

    return this.callAI(prompt, "第二轮诊断");
  }

  /**
   * 终面诊断：基于简历 + 岗位 + 全部前轮面试结果，给出终面专业评价和建议
   */
  async generateFinalRoundDiagnosis(
    resumeText: string,
    positionTitle: string,
    positionRequirements: string,
    allPreviousFeedbacks: string,
  ): Promise<AIDiagnosisResult> {
    const prompt = this.buildFinalRoundPrompt(
      resumeText,
      positionTitle,
      positionRequirements,
      allPreviousFeedbacks,
    );

    return this.callAI(prompt, "终面诊断");
  }

  // ==================== 自动生成入口 ====================

  /**
   * 为指定轮次生成 AI 诊断（统一入口，供各业务事件自动调用）
   * - 流程创建 → 生成第1轮
   * - 反馈提交 → 生成下一轮
   * - 简历上传 → 刷新初面
   * 如果已有诊断且 24h 内生成过，则跳过
   */
  async generateForRound(
    processId: string,
    roundNumber: number,
  ): Promise<TriggerDiagnosisResponseDto | null> {
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
        rounds: { orderBy: { roundNumber: "asc" } },
        interviews: {
          where: { roundNumber: { lt: roundNumber } },
          include: { feedbacks: true },
          orderBy: { roundNumber: "asc" },
        },
      },
    });

    if (!process) {
      this.logger.warn(`AI自动诊断跳过 - 流程不存在: processId=${processId}`);
      return null;
    }

    const roundConfig = process.rounds.find((r) => r.roundNumber === roundNumber);
    if (!roundConfig) {
      this.logger.warn(`AI自动诊断跳过 - 轮次未配置: round=${roundNumber}`);
      return null;
    }

    // 已有诊断且 24h 内不重复
    const existing = await this.prisma.aIDiagnosis.findUnique({
      where: { processId_roundNumber: { processId, roundNumber } },
    });
    if (existing && existing.analyzedAt) {
      const hoursSince = (Date.now() - new Date(existing.analyzedAt).getTime()) / (1000 * 60 * 60);
      if (hoursSince < 24) {
        this.logger.log(`AI自动诊断跳过 - 24h内已有: round=${roundNumber}`);
        return this._mapToDto(existing);
      }
    }

    const isHRRound = roundConfig.isHRRound || roundNumber === 1;
    const isFinalRound = roundConfig.roundType === "FINAL";
    const maxRound = process.rounds.reduce((m, r) => Math.max(m, r.roundNumber), 0);
    const isLastRound = roundNumber === maxRound;

    const resumeText = await this._getResumeText(process.candidate);
    const roundTypeText = roundConfig.roundType === "HR_SCREENING" ? "HR初筛"
      : roundConfig.roundType === "TECHNICAL" ? "技术面"
      : roundConfig.roundType === "FINAL" ? "终面"
      : `第${roundNumber}轮`;

    let result: AIDiagnosisResult;

    if (isHRRound) {
      if (!resumeText) {
        this.logger.log(`AI自动诊断跳过(初面无简历): processId=${processId}`);
        return null;
      }
      this.logger.log(`AI自动诊断(初面) - processId=${processId}`);
      result = await this.generateHRDiagnosis(
        resumeText, process.position.title,
        process.position.description || "",
        process.position.requirements || "",
      );
    } else if (roundNumber === 2) {
      if (!resumeText) {
        this.logger.log(`AI自动诊断跳过(二轮无简历): processId=${processId}`);
        return null;
      }
      const fb = this._buildFeedbacks(process.interviews);
      if (!fb) {
        this.logger.log(`AI自动诊断跳过(二轮无反馈): processId=${processId}`);
        return null;
      }
      this.logger.log(`AI自动诊断(第二轮) - processId=${processId}`);
      result = await this.generateSecondRoundDiagnosis(
        resumeText, process.position.title,
        process.position.requirements || "", fb,
      );
    } else if (isFinalRound || isLastRound) {
      if (!resumeText) {
        this.logger.log(`AI自动诊断跳过(终面无简历): processId=${processId}`);
        return null;
      }
      const fb = this._buildFeedbacks(process.interviews);
      if (!fb) {
        this.logger.log(`AI自动诊断跳过(终面无反馈): processId=${processId}`);
        return null;
      }
      this.logger.log(`AI自动诊断(终面) - processId=${processId}`);
      result = await this.generateFinalRoundDiagnosis(
        resumeText, process.position.title,
        process.position.requirements || "", fb,
      );
    } else {
      const fb = this._buildFeedbacks(process.interviews);
      if (!fb) {
        this.logger.log(`AI自动诊断跳过(无反馈): processId=${processId}`);
        return null;
      }
      this.logger.log(`AI自动诊断(第${roundNumber}轮) - processId=${processId}`);
      result = await this.generateRoundDiagnosis(
        fb, process.position.title,
        process.position.requirements || "",
        roundNumber, roundConfig.roundType,
      );
    }

    // 保存
    const saved = await this.prisma.aIDiagnosis.upsert({
      where: { processId_roundNumber: { processId, roundNumber } },
      create: {
        processId, roundNumber, positionId: process.positionId,
        matchScore: result.matchScore, matchLevel: result.matchLevel,
        strengths: result.strengths, weaknesses: result.weaknesses,
        suggestions: result.suggestions, questions: result.questions,
        summary: result.summary,
        rawOutput: JSON.stringify(result),
        inputSnapshot: { isHRRound, candidateId: process.candidateId, positionId: process.positionId, roundNumber },
      },
      update: {
        matchScore: result.matchScore, matchLevel: result.matchLevel,
        strengths: result.strengths, weaknesses: result.weaknesses,
        suggestions: result.suggestions, questions: result.questions,
        summary: result.summary,
        rawOutput: JSON.stringify(result), analyzedAt: new Date(),
      },
    });

    this.logger.log(
      `AI诊断已保存(自动) - diagnosisId=${saved.id}, round=${roundNumber}, type=${roundTypeText}`,
    );

    return this._mapToDto(saved);
  }

  // ==================== 内部方法 ====================

  /**
   * 构建 HR 轮 Prompt
   */
  private buildHRPrompt(
    resumeText: string,
    positionTitle: string,
    positionDescription: string,
    positionRequirements: string,
  ): string {
    return `你是一个专业的招聘顾问。请分析以下候选人简历与职位要求的匹配程度，并给出HR面试建议。

## 候选人简历
${resumeText}

## 应聘职位
职位名称: ${positionTitle}
职位描述: ${positionDescription}
任职要求: ${positionRequirements}

## 输出要求（JSON格式）
请严格按照以下 JSON 格式输出，不要输出任何其他内容：
{
  "matchScore": 75,
  "matchLevel": "medium",
  "strengths": ["5年Java开发经验", "熟悉Spring生态"],
  "weaknesses": ["缺乏团队管理经验", "项目经历描述不详"],
  "suggestions": [
    "重点了解其微服务架构设计能力",
    "评估学习能力和技术深度",
    "询问团队管理相关经验"
  ],
  "questions": [],
  "summary": ""
}

注意:
- matchScore 为 0-100 的整数，表示简历与岗位的匹配度
- matchLevel 为 "high"、"medium" 或 "low"
- strengths 列出候选人的优势（与岗位要求匹配的方面）
- weaknesses 列出候选人的不足或风险点
- suggestions 给出HR面试时的重点考察建议
- questions 在HR轮为空数组
- summary 为空字符串`;
  }

  /**
   * 构建后续轮次 Prompt
   */
  private buildRoundPrompt(
    previousFeedbacks: string,
    positionTitle: string,
    positionRequirements: string,
    roundNumber: number,
    roundType: string,
  ): string {
    return `你是一个专业的招聘顾问。请根据前轮面试反馈，为下一轮面试生成诊断建议和面试重点。

## 前轮面试反馈摘要
${previousFeedbacks}

## 应聘职位
职位名称: ${positionTitle}
职位要求: ${positionRequirements}

## 当前轮次
第${roundNumber}轮 ${roundType}

## 输出要求（JSON格式）
请严格按照以下 JSON 格式输出，不要输出任何其他内容：
{
  "summary": "HR面评分5/5，通过。技术扎实，沟通能力强，但缺乏管理经验。",
  "strengths": ["前轮反馈技术能力优秀", "沟通表达清晰"],
  "weaknesses": ["管理经验不足需进一步考察", "简历项目经历待验证"],
  "suggestions": [
    "重点考察微服务实战经验",
    "评估系统设计能力",
    "验证简历项目真实性"
  ],
  "questions": [
    "请详细描述你负责的微服务架构设计",
    "遇到过哪些生产事故，如何解决的？",
    "如何保证代码质量和团队协作效率？"
  ],
  "matchScore": 0,
  "matchLevel": ""
}

注意:
- summary 是对前轮反馈的简要总结
- strengths 是基于前轮反馈的候选人优势
- weaknesses 是需要在本轮重点考察的不足或风险
- suggestions 是本轮面试的考察重点建议
- questions 是建议在本轮面试中提问的问题（至少3个）
- matchScore 和 matchLevel 在后续轮次中设为 0 和空字符串`;
  }

  /**
   * 构建第二轮 Prompt — 简历 + 岗位 + 第一轮面试官评价
   */
  private buildSecondRoundPrompt(
    resumeText: string,
    positionTitle: string,
    positionRequirements: string,
    firstRoundFeedback: string,
  ): string {
    return `你是一个专业的招聘顾问。请结合候选人简历、岗位要求以及第一轮面试官的评价，为第二轮面试生成诊断分析和建议。

## 候选人简历
${resumeText}

## 应聘职位
职位名称: ${positionTitle}
任职要求: ${positionRequirements}

## 第一轮面试官评价
${firstRoundFeedback}

## 输出要求（JSON格式）
请严格按照以下 JSON 格式输出，不要输出任何其他内容：
{
  "matchScore": 72,
  "matchLevel": "medium",
  "strengths": ["第一轮反馈中技术能力获认可", "简历显示有相关项目经验"],
  "weaknesses": ["第一轮指出沟通表达需要提升", "某项技能深度待验证"],
  "suggestions": [
    "重点考察第一轮提到的薄弱点是否有改善",
    "深入验证简历中的核心项目经验",
    "评估与团队的协作适配度"
  ],
  "questions": [
    "针对第一轮反馈中的某个问题，请详细描述你的解决思路",
    "你在简历中提到的XX项目，具体承担了哪些职责？",
    "如果工作中遇到意见分歧，你会如何处理？"
  ],
  "summary": "第一轮面试中候选人技术基础扎实，但沟通表达有待加强。本轮需重点验证其实际项目经验和团队协作能力。"
}

注意:
- matchScore 为 0-100 的整数，综合简历与前轮反馈后的匹配度
- matchLevel 为 "high"、"medium" 或 "low"
- strengths 综合简历优势和第一轮正面评价
- weaknesses 结合第一轮指出的不足和简历中的潜在风险
- suggestions 针对第二轮面试的考察重点，要结合第一轮的反馈
- questions 是建议在本轮面试中提问的问题（至少3个），要有针对性
- summary 是对候选人当前状态的综合评价，要体现前轮反馈的影响`;
  }

  /**
   * 构建终面 Prompt — 简历 + 岗位 + 全部前轮面试结果，给出终面专业评价
   */
  private buildFinalRoundPrompt(
    resumeText: string,
    positionTitle: string,
    positionRequirements: string,
    allPreviousFeedbacks: string,
  ): string {
    return `你是一个资深招聘顾问和 Hiring Manager。这是候选人的最后一轮面试（终面），请综合候选人简历、岗位要求以及前面所有轮次的面试结果，给出终面的专业评价和录用建议。

## 候选人简历
${resumeText}

## 应聘职位
职位名称: ${positionTitle}
任职要求: ${positionRequirements}

## 前轮面试结果汇总
${allPreviousFeedbacks}

## 输出要求（JSON格式）
请严格按照以下 JSON 格式输出，不要输出任何其他内容：
{
  "matchScore": 78,
  "matchLevel": "medium",
  "strengths": ["多轮面试中技术能力一致获得好评", "项目经验丰富且与岗位高度匹配", "学习能力和成长潜力突出"],
  "weaknesses": ["管理经验仍有待积累", "某项关键技术深度需进一步提升"],
  "suggestions": [
    "终面建议重点关注候选人的长期发展潜力和文化匹配度",
    "评估其是否具备胜任岗位的综合能力",
    "确认薪资预期和入职意愿"
  ],
  "questions": [
    "你对未来3-5年的职业规划是什么？",
    "你如何看待我们公司和这个岗位？",
    "如果录用，你能为团队带来什么独特价值？"
  ],
  "summary": "经过前两轮面试，候选人技术能力扎实，项目经验丰富，与岗位匹配度较高。综合评估建议录用，定级为中高级工程师。终面建议重点考察文化匹配度和长期发展潜力。"
}

注意:
- 这是终面，需要给出更加全面和权威的评价
- matchScore 为 0-100 的整数，是综合所有轮次后的最终匹配度判断
- matchLevel 为 "high"、"medium" 或 "low"
- strengths 要总结前轮所有正面评价和候选人核心优势
- weaknesses 要汇总前轮所有不足，评估是否构成录用障碍
- suggestions 要针对终面的重点，包括录用建议、定级建议、入职注意事项
- questions 是终面建议提问的问题（至少3个），侧重职业规划、文化匹配、入职意愿
- summary 是终面的综合评价，要包含明确的录用建议（建议录用/建议观察/不建议录用）`;
  }

  /**
   * 调用百炼 API（带重试机制）
   */
  private async callAI(
    prompt: string,
    context: string,
  ): Promise<AIDiagnosisResult> {
    try {
      const result = await this.doCall(prompt);
      return result;
    } catch (error) {
      this.logger.warn(`${context} - 首次调用失败，重试中: ${error instanceof Error ? error.message : String(error)}`);
      try {
        const result = await this.doCall(prompt);
        return result;
      } catch (retryError) {
        this.logger.error(`${context} - 重试仍然失败，返回默认结果: ${retryError instanceof Error ? retryError.message : String(retryError)}`);
        return { ...DEFAULT_RESULT };
      }
    }
  }

  /**
   * 执行一次 API 调用
   */
  private async doCall(prompt: string): Promise<AIDiagnosisResult> {
    const response = await fetch(`${this.apiBase}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "你是一个专业的招聘顾问，擅长分析候选人简历与岗位的匹配度，并给出面试建议。请始终以JSON格式输出结果。",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `百炼 API 请求失败 (HTTP ${response.status}): ${errorText}`,
      );
    }

    const data: any = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("百炼 API 返回空内容");
    }

    return this.parseJSON(content);
  }

  /**
   * 解析 AI 返回的 JSON，处理可能的 markdown 代码块包裹
   */
  private parseJSON(raw: string): AIDiagnosisResult {
    let jsonStr = raw.trim();

    // 去除可能的 markdown 代码块标记
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch && codeBlockMatch[1] !== undefined) {
      jsonStr = codeBlockMatch[1].trim();
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      this.logger.warn(`JSON 解析失败，原始内容: ${jsonStr.substring(0, 500)}`);
      throw new Error(`AI 返回内容不是有效的 JSON: ${e instanceof Error ? e.message : String(e)}`);
    }

    return this.normalizeResult(parsed);
  }

  /**
   * 规范化返回结果，确保所有字段存在且类型正确
   */
  private normalizeResult(raw: any): AIDiagnosisResult {
    const result: AIDiagnosisResult = {
      matchScore: typeof raw.matchScore === "number" ? raw.matchScore : undefined,
      matchLevel: typeof raw.matchLevel === "string" ? raw.matchLevel : undefined,
      strengths: Array.isArray(raw.strengths)
        ? raw.strengths.filter((s: any) => typeof s === "string")
        : [],
      weaknesses: Array.isArray(raw.weaknesses)
        ? raw.weaknesses.filter((s: any) => typeof s === "string")
        : [],
      suggestions: Array.isArray(raw.suggestions)
        ? raw.suggestions.filter((s: any) => typeof s === "string")
        : [],
      questions: Array.isArray(raw.questions)
        ? raw.questions.filter((s: any) => typeof s === "string")
        : [],
      summary: typeof raw.summary === "string" ? raw.summary : "",
    };

    return result;
  }

  // ==================== 自动生成辅助方法 ====================

  /**
   * 获取候选人简历文本
   */
  private async _getResumeText(candidate: any): Promise<string | null> {
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
        this.logger.warn(`简历文件解析失败: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    return null;
  }

  /**
   * 构建前轮反馈摘要
   */
  private _buildFeedbacks(interviews: any[]): string | null {
    if (!interviews || interviews.length === 0) return null;

    const parts: string[] = [];
    for (const interview of interviews) {
      if (!interview.feedbacks || interview.feedbacks.length === 0) continue;
      const roundNum = interview.roundNumber || "?";
      for (const fb of interview.feedbacks) {
        const interviewerName = fb.interviewer?.name || "未知面试官";
        let text = `第${roundNum}轮 - ${interviewerName}：\n`;
        text += `结论：${fb.result}\n`;
        if (fb.overallRating) text += `评分：${fb.overallRating}/5\n`;
        if (fb.strengths) text += `优势：${fb.strengths}\n`;
        if (fb.weaknesses) text += `不足：${fb.weaknesses}\n`;
        if (fb.notes) text += `评语：${fb.notes}\n`;
        parts.push(text.trim());
      }
    }
    return parts.length > 0 ? parts.join("\n\n") : null;
  }

  /**
   * 映射到 DTO
   */
  private _mapToDto(diagnosis: any): TriggerDiagnosisResponseDto {
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
