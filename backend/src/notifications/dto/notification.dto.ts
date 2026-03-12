import { IsString, IsOptional, IsEnum, IsBoolean } from "class-validator";
import { NotificationType } from "@prisma/client";

export class CreateNotificationDto {
  @IsString()
  userId!: string;

  // @IsEnum(NotificationType)
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
