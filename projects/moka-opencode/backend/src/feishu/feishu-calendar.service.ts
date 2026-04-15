import { Injectable, Logger } from "@nestjs/common";

/**
 * FeishuCalendarService - 飞书日历服务
 *
 * 使用 lark-cli 命令行工具管理飞书日程。
 * 所有 lark-cli 调用失败时不抛出异常，返回 null 并记录日志。
 * 时间格式统一使用 ISO 8601 +08:00（北京时间）。
 */
@Injectable()
export class FeishuCalendarService {
  private readonly logger = new Logger(FeishuCalendarService.name);

  /**
   * 创建日程
   * @param title 日程标题
   * @param description 日程描述
   * @param startTime 开始时间（Date 或 ISO 字符串）
   * @param endTime 结束时间（Date 或 ISO 字符串）
   * @param attendeeOuIds 参会人 OuId 数组
   * @returns 创建的 eventId，失败返回 null
   */
  async createEvent(
    title: string,
    description: string,
    startTime: Date | string,
    endTime: Date | string,
    attendeeOuIds: string[],
  ): Promise<string | null> {
    const startIso = this.toIso8601(startTime);
    const endIso = this.toIso8601(endTime);
    const attendeeIds = attendeeOuIds.join(",");

    const cmd = `lark-cli calendar +create --summary ${this.shellEscape(title)} --description ${this.shellEscape(description)} --start ${this.shellEscape(startIso)} --end ${this.shellEscape(endIso)} --attendee-ids ${this.shellEscape(attendeeIds)}`;

    this.logger.log(`Creating calendar event: ${title}`);
    this.logger.debug(`Command: ${cmd}`);

    try {
      const result = await Bun.$`${cmd}`.text();
      const eventId = this.parseEventId(result);
      if (eventId) {
        this.logger.log(`Calendar event created: ${eventId}`);
      }
      return eventId;
    } catch (error) {
      this.logger.error(
        `Failed to create calendar event: ${title}`,
        error instanceof Error ? error.stack : String(error),
      );
      return null;
    }
  }

  /**
   * 删除日程
   * @param eventId 日程 ID
   */
  async deleteEvent(eventId: string): Promise<void> {
    const cmd = `lark-cli calendar events delete --event-id ${this.shellEscape(eventId)}`;

    this.logger.log(`Deleting calendar event: ${eventId}`);
    this.logger.debug(`Command: ${cmd}`);

    try {
      await Bun.$`${cmd}`.text();
      this.logger.log(`Calendar event deleted: ${eventId}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete calendar event: ${eventId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /**
   * 更新日程
   * @param eventId 日程 ID
   * @param title 新标题
   * @param description 新描述
   * @param startTime 新开始时间
   * @param endTime 新结束时间
   * @param attendeeOuIds 新参会人 OuId 数组
   * @returns 更新后的 eventId，失败返回 null
   */
  async updateEvent(
    eventId: string,
    title: string,
    description: string,
    startTime: Date | string,
    endTime: Date | string,
    attendeeOuIds: string[],
  ): Promise<string | null> {
    const startIso = this.toIso8601(startTime);
    const endIso = this.toIso8601(endTime);
    const attendeeIds = attendeeOuIds.join(",");

    const cmd = `lark-cli calendar events update --event-id ${this.shellEscape(eventId)} --summary ${this.shellEscape(title)} --description ${this.shellEscape(description)} --start ${this.shellEscape(startIso)} --end ${this.shellEscape(endIso)} --attendee-ids ${this.shellEscape(attendeeIds)}`;

    this.logger.log(`Updating calendar event: ${eventId}`);
    this.logger.debug(`Command: ${cmd}`);

    try {
      const result = await Bun.$`${cmd}`.text();
      const parsedId = this.parseEventId(result) || eventId;
      this.logger.log(`Calendar event updated: ${parsedId}`);
      return parsedId;
    } catch (error) {
      this.logger.error(
        `Failed to update calendar event: ${eventId}`,
        error instanceof Error ? error.stack : String(error),
      );
      return null;
    }
  }

  /**
   * 将 Date 或字符串转为 ISO 8601 格式（+08:00 时区）
   */
  private toIso8601(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value);

    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${value}`);
    }

    // 获取 UTC 时间，然后加上 8 小时偏移
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    const hours = String(date.getUTCHours() + 8).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    const seconds = String(date.getUTCSeconds()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+08:00`;
  }

  /**
   * 从 lark-cli 输出中解析 eventId
   */
  private parseEventId(output: string): string | null {
    // 尝试匹配常见的 eventId 格式
    const patterns = [
      /event_id["\s:]+([^\s"\n]+)/i,
      /eventId["\s:]+([^\s"\n]+)/i,
      /"event_id"\s*:\s*"([^"]+)"/i,
      /"eventId"\s*:\s*"([^"]+)"/i,
    ];

    for (const pattern of patterns) {
      const match = output.match(pattern);
      if (match) {
        return match[1] || null;
      }
    }

    // 如果输出看起来就是一个 ID（短字符串，无空格）
    const trimmed = output.trim();
    if (trimmed && trimmed.length > 0 && !trimmed.includes(" ") && !trimmed.includes("\n")) {
      return trimmed;
    }

    this.logger.warn(`Could not parse event ID from output: ${output.substring(0, 200)}`);
    return null;
  }

  /**
   * 安全地转义 shell 参数
   */
  private shellEscape(value: string): string {
    // 使用单引号包裹，并将内部的单引号替换为 '\''
    return `'${value.replace(/'/g, "'\\''")}'`;
  }
}
