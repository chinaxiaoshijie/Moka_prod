import { IsString, IsOptional, IsInt, IsEnum, Min } from "class-validator";

// 使用字符串字面量而非 Prisma 枚举，因为 Prisma 枚举在运行时不可用
export type PositionStatus = "OPEN" | "PAUSED" | "CLOSED";
export const POSITION_STATUS_VALUES = ["OPEN", "PAUSED", "CLOSED"] as const;

export class CreatePositionDto {
  @IsString({ message: "职位名称不能为空" })
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt({ message: "最低薪资必须是整数" })
  @Min(0, { message: "最低薪资不能小于0" })
  salaryMin?: number;

  @IsOptional()
  @IsInt({ message: "最高薪资必须是整数" })
  @Min(0, { message: "最高薪资不能小于0" })
  salaryMax?: number;

  @IsOptional()
  @IsInt({ message: "招聘人数必须是整数" })
  @Min(1, { message: "招聘人数不能小于1" })
  headcount?: number;

  @IsOptional()
  @IsString()
  location?: string;
}

export class UpdatePositionDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt({ message: "最低薪资必须是整数" })
  @Min(0, { message: "最低薪资不能小于0" })
  salaryMin?: number;

  @IsOptional()
  @IsInt({ message: "最高薪资必须是整数" })
  @Min(0, { message: "最高薪资不能小于0" })
  salaryMax?: number;

  @IsOptional()
  @IsInt({ message: "招聘人数必须是整数" })
  @Min(1, { message: "招聘人数不能小于1" })
  headcount?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(POSITION_STATUS_VALUES, {
    message: "职位状态必须是 OPEN, PAUSED 或 CLOSED",
  })
  status?: PositionStatus;
}

export class PositionResponseDto {
  id!: string;
  title!: string;
  description!: string | null;
  salaryMin!: number | null;
  salaryMax!: number | null;
  headcount!: number;
  hiredCount!: number;
  inProgressCount!: number;
  status!: PositionStatus;
  location!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}

export class PositionListResponseDto {
  items!: PositionResponseDto[];
  total!: number;
  page!: number;
  pageSize!: number;
}
