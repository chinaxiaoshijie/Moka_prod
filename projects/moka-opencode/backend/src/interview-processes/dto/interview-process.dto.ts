import { IsString, IsBoolean, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RoundConfigDto {
  @IsNumber()
  roundNumber!: number;

  @IsString()
  interviewerId!: string;

  @IsBoolean()
  isHRRound!: boolean;

  @IsString()
  roundType!: string;
}

export class CreateInterviewProcessDto {
  @IsString()
  candidateId!: string;

  @IsString()
  positionId!: string;

  @IsBoolean()
  @IsOptional()
  hasHRRound?: boolean;

  @IsNumber()
  @IsOptional()
  totalRounds?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoundConfigDto)
  rounds!: RoundConfigDto[];
}

export class CreateRoundInterviewDto {
  @IsString()
  startTime!: string;

  @IsString()
  endTime!: string;

  @IsString()
  format!: "ONLINE" | "OFFLINE";

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  meetingUrl?: string;

  @IsString()
  @IsOptional()
  meetingNumber?: string;
}

export interface ProcessRoundConfig {
  roundNumber: number;
  interviewerId: string;
  interviewerName: string;
  isHRRound: boolean;
  roundType: string;
}

export interface ProcessInterviewDto {
  id: string;
  roundNumber: number;
  interviewerName: string;
  type: string;
  format: string;
  startTime: string;
  status: string;
  hasFeedback: boolean;
  feedbackResult?: string;
}

export interface ProcessResponseDto {
  id: string;
  candidateId: string;
  candidateName: string;
  positionId: string;
  positionTitle: string;
  currentRound: number;
  totalRounds: number;
  status: string;
  hasHRRound: boolean;
  rounds: ProcessRoundConfig[];
  interviews: ProcessInterviewDto[];
  createdAt: string;
}

export interface ProcessListResponseDto {
  items: ProcessResponseDto[];
  total: number;
  page: number;
  pageSize: number;
}
