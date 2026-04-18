import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export interface FeishuInterviewReminderData {
  candidateName: string;
  positionTitle: string;
  interviewerName: string;
  interviewerFeishuOuId: string;
  startTime: Date;
  endTime: Date;
  roundNumber?: number;
  format?: string;
  location?: string;
  meetingUrl?: string;
  meetingNumber?: string;
  aiDiagnosis?: {
    matchScore?: number;
    matchLevel?: string;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    questions: string[];
    summary: string;
  };
}

/**
 * 飞书消息服务
 * 通过飞书开放平台 API 以应用机器人身份向用户发送消息
 */
@Injectable()
export class FeishuMessageService {
  private readonly logger = new Logger(FeishuMessageService.name);
  private readonly apiBase = "https://open.feishu.cn/open-apis";

  constructor(private configService: ConfigService) {}

  /**
   * 获取 tenant_access_token
   */
  private async getTenantAccessToken(): Promise<string | null> {
    const appId = this.configService.get<string>("LARK_APP_ID");
    const appSecret = this.configService.get<string>("LARK_APP_SECRET");

    if (!appId || !appSecret) {
      this.logger.warn("LARK_APP_ID 或 LARK_APP_SECRET 未配置，飞书消息发送跳过");
      return null;
    }

    try {
      const res = await fetch(`${this.apiBase}/auth/v3/tenant_access_token/internal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
      });

      const data = await res.json() as { code: number; tenant_access_token?: string; msg?: string };
      if (data.code !== 0) {
        this.logger.error(`获取 tenant_access_token 失败: ${JSON.stringify(data)}`);
        return null;
      }

      return data.tenant_access_token!;
    } catch (error) {
      this.logger.error(`获取 tenant_access_token 异常: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * 发送面试提醒飞书卡片消息给面试官
   */
  async sendInterviewReminder(data: FeishuInterviewReminderData): Promise<boolean> {
    const token = await this.getTenantAccessToken();
    if (!token) {
      this.logger.warn("飞书消息发送跳过 - 无 token");
      return false;
    }

    if (!data.interviewerFeishuOuId) {
      this.logger.warn(`面试官 ${data.interviewerName} 未绑定飞书账号，跳过消息发送`);
      return false;
    }

    // 构建飞书卡片消息
    const roundText = data.roundNumber
      ? `第${data.roundNumber}轮面试`
      : "面试";

    const timeStr = this.formatDateTime(data.startTime);
    const endTimeStr = this.formatTime(data.endTime);

    // 构建 AI 诊断摘要
    let aiSection = "";
    if (data.aiDiagnosis) {
      const diag = data.aiDiagnosis;
      const scoreText = diag.matchScore ? `（匹配度 ${diag.matchScore}%）` : "";
      aiSection = `
**AI 诊断分析${scoreText}**
${diag.summary || "暂无摘要"}

`;
    }

    // 构建卡片 JSON
    const card = {
      config: { wide_screen_mode: true },
      header: {
        title: {
          tag: "plain_text",
          content: `📅 面试提醒 — ${roundText}`,
        },
        template: "blue",
      },
      elements: [
        {
          tag: "div",
          text: {
            tag: "lark_md",
            content: [
              `**候选人**: ${data.candidateName}`,
              `**职位**: ${data.positionTitle}`,
              `**面试官**: ${data.interviewerName}`,
              `**时间**: ${timeStr} - ${endTimeStr}`,
              data.format === "ONLINE"
                ? `**方式**: 线上${data.meetingUrl ? ` | [点击进入](${data.meetingUrl})` : ""}${data.meetingNumber ? ` | 会议号: ${data.meetingNumber}` : ""}`
                : `**方式**: 线下 | **地点**: ${data.location || "待定"}`,
              aiSection ? "" : "",
            ].filter(Boolean).join("\n"),
          },
        },
        ...(aiSection ? [{
          tag: "div",
          text: { tag: "lark_md", content: aiSection.trim() },
        }] : []),
        { tag: "hr" },
        {
          tag: "note",
          elements: [
            {
              tag: "plain_text",
              content: "码隆智能面试系统",
            },
          ],
        },
      ],
    };

    try {
      const res = await fetch(`${this.apiBase}/im/v1/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receive_id: data.interviewerFeishuOuId,
          receive_id_type: "open_id",
          msg_type: "interactive",
          content: JSON.stringify(card),
        }),
      });

      const result = await res.json() as { code: number; msg?: string; data?: unknown };
      if (result.code !== 0) {
        // 权限相关错误需要特别提示
        if (result.code === 99991672 || String(result.msg).includes("permission")) {
          this.logger.error(`飞书消息发送失败 - 可能缺少「发消息」权限 (code=${result.code}): ${result.msg}`);
        } else {
          this.logger.error(`飞书消息发送失败 (code=${result.code}): ${result.msg}`);
        }
        return false;
      }

      this.logger.log(
        `飞书面试提醒已发送 — 面试官: ${data.interviewerName} (${data.interviewerFeishuOuId})`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `飞书消息发送异常: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  private formatDateTime(date: Date): string {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${month}月${day}日 ${hours}:${minutes}`;
  }

  private formatTime(date: Date): string {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }
}
