import { Injectable } from "@nestjs/common";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require("pdf-parse");

export interface ExtractedCandidateInfo {
  name: string | null;
  phone: string | null;
  email: string | null;
  rawText: string;
}

@Injectable()
export class ResumeParserService {
  async parsePdf(buffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(buffer);
      if (!data.text || data.text.trim().length === 0) {
        throw new Error("PDF内容为空，无法解析");
      }
      return data.text;
    } catch (error: any) {
      if (error.message?.includes("PDF内容为空")) {
        throw error;
      }
      throw new Error(`PDF解析失败: ${error.message}`);
    }
  }

  extractCandidateInfo(text: string): ExtractedCandidateInfo {
    const phone = this.extractPhone(text);
    const email = this.extractEmail(text);
    const name = this.extractName(text);

    return {
      name,
      phone,
      email,
      rawText: text,
    };
  }

  private extractPhone(text: string): string | null {
    const phonePatterns = [
      /1[3-9]\d{9}/,
      /\b1[3-9]\d{2}[-\s]?\d{4}[-\s]?\d{4}\b/,
    ];

    for (const pattern of phonePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0].replace(/[-\s]/g, "");
      }
    }
    return null;
  }

  private extractEmail(text: string): string | null {
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const match = text.match(emailPattern);
    return match ? match[0] : null;
  }

  private extractName(text: string): string | null {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    // Pattern 1: "姓名：张三"
    for (const line of lines) {
      const nameMatch = line.match(/姓名[：:]\s*([^\s]{2,4})/);
      if (nameMatch) {
        return nameMatch[1].trim();
      }
    }

    // Pattern 2: "张三 / 男" or "张三 男"
    for (const line of lines) {
      const match = line.match(/^([\u4e00-\u9fa5]{2,4})\s*[\/|\s]\s*[男女]/);
      if (match) {
        return match[1];
      }
    }

    // Pattern 3: standalone Chinese name in first 5 lines
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      const nameMatch = line.match(/^[\u4e00-\u9fa5]{2,4}$/);
      if (nameMatch && !this.isCommonFalsePositive(line)) {
        return nameMatch[0];
      }
    }

    // Pattern 4: "Name: Zhang San" or first Chinese name in first 10 lines
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const line = lines[i];
      // Match a Chinese name at the start of a line that also contains phone/email-like content
      const match = line.match(/([\u4e00-\u9fa5]{2,4})/);
      if (match && !this.isCommonFalsePositive(match[1]) && line.length < 30) {
        // Short line with a Chinese name is likely a name line
        if (/1[3-9]\d/.test(line) || /@/.test(line) || /[男女]/.test(line)) {
          return match[1];
        }
      }
    }

    return null;
  }

  private isCommonFalsePositive(text: string): boolean {
    const falsePositives = [
      "简历",
      "个人信息",
      "联系方式",
      "求职意向",
      "工作经验",
      "教育经历",
      "项目经验",
      "自我评价",
      "技能特长",
      "培训经历",
      "获奖情况",
      "附加信息",
      "基本信息",
      "个人简历",
      "工作经历",
    ];
    return falsePositives.includes(text);
  }
}
