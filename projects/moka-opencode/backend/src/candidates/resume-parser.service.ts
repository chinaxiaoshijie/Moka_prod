import { Injectable } from "@nestjs/common";
// import pdfParse from "pdf-parse";

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
      // const data = await pdfParse(buffer);
      // return data.text;
      return "PDF parsing disabled";
    } catch (error: any) {
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

    for (const line of lines) {
      const nameMatch = line.match(/姓名[：:]\s*([^\s]{2,4})/);
      if (nameMatch) {
        return nameMatch[1].trim();
      }
    }

    for (const line of lines) {
      const match = line.match(/^([\u4e00-\u9fa5]{2,4})\s*[\/|\s]\s*[男女]/);
      if (match) {
        return match[1];
      }
    }

    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      const nameMatch = line.match(/^[\u4e00-\u9fa5]{2,4}$/);
      if (nameMatch && !this.isCommonFalsePositive(line)) {
        return nameMatch[0];
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
    ];
    return falsePositives.includes(text);
  }
}
