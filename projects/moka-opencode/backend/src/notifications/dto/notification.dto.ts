import { IsString, IsOptional, IsIn, IsBoolean } from "class-validator";

// 使用字符串字面量而非 Prisma 枚举
export type NotificationType = "INTERVIEW_REMINDER" | "FEEDBACK_REQUEST" | "PROCESS_UPDATE" | "SYSTEM";
export const NOTIFICATION_TYPE_VALUES = ["INTERVIEW_REMINDER", "FEEDBACK_REQUEST", "PROCESS_UPDATE", "SYSTEM"] as const;

export class CreateNotificationDto {
  @IsString()
  userId!: string;

  @IsIn(NOTIFICATION_TYPE_VALUES, {
    message: "通知类型必须是 INTERVIEW_REMINDER, FEEDBACK_REQUEST, PROCESS_UPDATE 或 SYSTEM",
  })
  type!: NotificationType;

  @IsString()
  title!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  link?: string;
}

export class NotificationResponseDto {
  id!: string;
  userId!: string;
  type!: NotificationType;
  title!: string;
  content!: string;
  read!: boolean;
  link!: string | null;
  createdAt!: Date;
}

export class NotificationListResponseDto {
  items!: NotificationResponseDto[];
  total!: number;
  unreadCount!: number;
}
