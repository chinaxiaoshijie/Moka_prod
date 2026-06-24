import { IsString, IsOptional, IsIn, IsDateString, IsInt } from "class-validator";

// 使用字符串字面量而非 Prisma 枚举
export type InterviewType = "INTERVIEW_1" | "INTERVIEW_2" | "INTERVIEW_3";
export const INTERVIEW_TYPE_VALUES = ["INTERVIEW_1", "INTERVIEW_2", "INTERVIEW_3"] as const;

export type InterviewFormat = "ONLINE" | "OFFLINE";
export const INTERVIEW_FORMAT_VALUES = ["ONLINE", "OFFLINE"] as const;

export type InterviewStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";
export const INTERVIEW_STATUS_VALUES = ["SCHEDULED", "COMPLETED", "CANCELLED"] as const;

export class CreateInterviewDto {
  @IsString()
  candidateId!: string;

  @IsString()
  positionId!: string;

  @IsString()
  interviewerId!: string;

  @IsIn(INTERVIEW_TYPE_VALUES, {
    message: "面试类型必须是 INTERVIEW_1, INTERVIEW_2 或 INTERVIEW_3",
  })
  type!: InterviewType;

  @IsIn(INTERVIEW_FORMAT_VALUES, {
    message: "面试形式必须是 ONLINE 或 OFFLINE",
  })
  format!: InterviewFormat;

  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  meetingUrl?: string;

  @IsOptional()
  @IsString()
  meetingNumber?: string;

  @IsOptional()
  @IsString()
  processId?: string;

  @IsOptional()
  @IsInt()
  roundNumber?: number;
}

export class UpdateInterviewDto {
  @IsOptional()
  @IsString()
  interviewerId?: string;

  @IsOptional()
  @IsIn(INTERVIEW_TYPE_VALUES, {
    message: "面试类型必须是 INTERVIEW_1, INTERVIEW_2 或 INTERVIEW_3",
  })
  type?: InterviewType;

  @IsOptional()
  @IsIn(INTERVIEW_FORMAT_VALUES, {
    message: "面试形式必须是 ONLINE 或 OFFLINE",
  })
  format?: InterviewFormat;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  meetingUrl?: string;

  @IsOptional()
  @IsString()
  meetingNumber?: string;

  @IsOptional()
  @IsIn(INTERVIEW_STATUS_VALUES, {
    message: "面试状态必须是 SCHEDULED, COMPLETED 或 CANCELLED",
  })
  status?: InterviewStatus;
}

export class InterviewResponseDto {
  id!: string;
  candidateId!: string;
  candidate!: { name: string; phone: string; email: string | null };
  positionId!: string;
  position!: { title: string };
  interviewerId!: string;
  interviewer!: { name: string; email: string | null };
  type!: InterviewType;
  format!: InterviewFormat;
  startTime!: Date;
  endTime!: Date;
  location!: string | null;
  meetingUrl!: string | null;
  meetingNumber!: string | null;
  status!: InterviewStatus;
  processId!: string | null;
  roundNumber!: number | null;
  process!: {
    id: string;
    status: string;
    totalRounds: number;
    currentRound: number;
  } | null;
  createdAt!: Date;
}

export class InterviewListResponseDto {
  items!: InterviewResponseDto[];
  total!: number;
  page!: number;
  pageSize!: number;
}
