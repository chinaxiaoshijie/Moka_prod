import { IsString, IsOptional, IsInt, IsEnum } from "class-validator";
import { CandidateStatus, CandidateSource } from "@prisma/client";

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
  // // @IsEnum(CandidateStatus)
  status?: CandidateStatus;

  @IsOptional()
  // // @IsEnum(CandidateSource)
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
  // @IsEnum(CandidateStatus)
  status?: CandidateStatus;

  @IsOptional()
  // @IsEnum(CandidateSource)
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
  status: any;
  source: any | null;
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
