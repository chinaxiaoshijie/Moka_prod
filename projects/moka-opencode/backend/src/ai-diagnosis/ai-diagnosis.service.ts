import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export interface AIDiagnosisResult {
  matchScore?: number;
  matchLevel?: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  questions: string[];
  summary: string;
}

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

  constructor(private configService: ConfigService) {
    this.apiKey =
      this.configService.get<string>("DASHSCOPE_API_KEY") ||
      "sk-4ac26721ba2e4c54ba6e8a777e42e257";
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
}
