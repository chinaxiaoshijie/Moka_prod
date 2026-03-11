import { IsString, IsOptional, IsEnum, IsDateString } from "class-validator";
import {
  InterviewType,
  InterviewFormat,
  InterviewStatus,
} from "@prisma/client";

export class CreateInterviewDto {
  @IsString()
  candidateId!: string;

  @IsString()
  positionId!: string;

  @IsString()
  interviewerId!: string;

  @IsEnum(InterviewType)
  type!: InterviewType;

  @IsEnum(InterviewFormat)
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
}

export class UpdateInterviewDto {
  @IsOptional()
  @IsString()
  interviewerId?: string;

  @IsOptional()
  @IsEnum(InterviewType)
  type?: InterviewType;

  @IsOptional()
  @IsEnum(InterviewFormat)
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
  @IsEnum(InterviewStatus)
  status?: InterviewStatus;
}

export class InterviewResponseDto {
  id!: string;
  candidateId!: string;
  candidate!: { name: string; phone: string };
  positionId!: string;
  position!: { title: string };
  interviewerId!: string;
  interviewer!: { name: string };
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
