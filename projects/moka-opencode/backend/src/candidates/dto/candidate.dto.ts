import { IsString, IsOptional, IsInt, IsEnum } from "class-validator";

// 使用字符串字面量而非 Prisma 枚举
export type CandidateStatus = "PENDING" | "SCREENING" | "INTERVIEW_1" | "INTERVIEW_2" | "INTERVIEW_3" | "HIRED" | "REJECTED";
export const CANDIDATE_STATUS_VALUES = ["PENDING", "SCREENING", "INTERVIEW_1", "INTERVIEW_2", "INTERVIEW_3", "HIRED", "REJECTED"] as const;

export type CandidateSource = "BOSS" | "REFERRAL" | "HEADHUNTER" | "WEBSITE";
export const CANDIDATE_SOURCE_VALUES = ["BOSS", "REFERRAL", "HEADHUNTER", "WEBSITE"] as const;

export class CreateCandidateDto {
  @IsString({ message: "姓名不能为空" })
  name!: string;

  @IsString({ message: "电话不能为空" })
  phone!: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  positionId?: string;

  @IsOptional()
  @IsEnum(CANDIDATE_STATUS_VALUES, {
    message: "候选人状态必须是 PENDING, SCREENING, INTERVIEW_1, INTERVIEW_2, INTERVIEW_3, HIRED 或 REJECTED",
  })
  status?: CandidateStatus;

  @IsOptional()
  @IsEnum(CANDIDATE_SOURCE_VALUES, {
    message: "候选人来源必须是 BOSS, REFERRAL, HEADHUNTER 或 WEBSITE",
  })
  source?: CandidateSource;

  @IsOptional()
  @IsString()
  resumeUrl?: string;
}

export class UpdateCandidateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  positionId?: string;

  @IsOptional()
  @IsEnum(CANDIDATE_STATUS_VALUES, {
    message: "候选人状态必须是 PENDING, SCREENING, INTERVIEW_1, INTERVIEW_2, INTERVIEW_3, HIRED 或 REJECTED",
  })
  status?: CandidateStatus;

  @IsOptional()
  @IsEnum(CANDIDATE_SOURCE_VALUES, {
    message: "候选人来源必须是 BOSS, REFERRAL, HEADHUNTER 或 WEBSITE",
  })
  source?: CandidateSource;

  @IsOptional()
  @IsString()
  resumeUrl?: string;
}

export class CandidateResponseDto {
  id!: string;
  name!: string;
  phone!: string;
  email!: string | null;
  positionId!: string | null;
  position!: { title: string } | null;
  status!: CandidateStatus;
  source!: CandidateSource | null;
  resumeUrl!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}

export class CandidateListResponseDto {
  items!: CandidateResponseDto[];
  total!: number;
  page!: number;
  pageSize!: number;
}
