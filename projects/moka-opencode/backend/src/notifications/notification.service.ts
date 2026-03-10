import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateNotificationDto,
  NotificationResponseDto,
  NotificationListResponseDto,
} from "./dto/notification.dto";
import { NotificationType } from "@prisma/client";

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async create(
    createDto: CreateNotificationDto,
  ): Promise<NotificationResponseDto> {
    const notification = await this.prisma.notification.create({
      data: createDto,
    });

    return this.mapToResponseDto(notification);
  }

  async findAll(
    userId: string,
    unreadOnly?: boolean,
  ): Promise<NotificationListResponseDto> {
    const where: any = { userId };

    if (unreadOnly) {
      where.read = false;
    }

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { userId, read: false },
      }),
    ]);

    return {
      items: items.map((item) => this.mapToResponseDto(item)),
      total,
      unreadCount,
    };
  }

  async markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<NotificationResponseDto> {
    const notification = await this.prisma.notification.update({
      where: { id: notificationId, userId },
      data: { read: true },
    });

    return this.mapToResponseDto(notification);
  }

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    return { count: result.count };
  }

  async delete(notificationId: string, userId: string): Promise<void> {
    await this.prisma.notification.delete({
      where: { id: notificationId, userId },
    });
  }

  async createInterviewReminder(
    userId: string,
    interviewId: string,
    candidateName: string,
    startTime: Date,
  ): Promise<NotificationResponseDto> {
    return this.create({
      userId,
      type: NotificationType.INTERVIEW_REMINDER,
      title: "面试即将开始",
      content: `您与 ${candidateName} 的面试将在 ${startTime.toLocaleString("zh-CN")} 开始`,
      link: `/interviews/${interviewId}`,
    });
  }

  async createFeedbackRequest(
    userId: string,
    interviewId: string,
    candidateName: string,
  ): Promise<NotificationResponseDto> {
    return this.create({
      userId,
      type: NotificationType.FEEDBACK_REQUEST,
      title: "请填写面试反馈",
      content: `您已完成与 ${candidateName} 的面试，请及时填写反馈`,
      link: `/feedback/submit?interviewId=${interviewId}`,
    });
  }

  private mapToResponseDto(notification: any): NotificationResponseDto {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      content: notification.content,
      read: notification.read,
      link: notification.link,
      createdAt: notification.createdAt,
    };
  }
}
