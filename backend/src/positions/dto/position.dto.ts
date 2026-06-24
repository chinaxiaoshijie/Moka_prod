import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsInt, IsIn, Min, Max } from "class-validator";

// 使用字符串字面量而非 Prisma 枚举，因为 Prisma 枚举在运行时不可用
export type PositionStatus = "OPEN" | "PAUSED" | "CLOSED";
export const POSITION_STATUS_VALUES = ["OPEN", "PAUSED", "CLOSED"] as const;

export class CreatePositionDto {
  @ApiProperty({ description: "职位名称", example: "高级前端工程师" })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ description: "职位描述" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: "最低薪资", example: 15000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  salaryMin?: number;

  @ApiPropertyOptional({ description: "最高薪资", example: 25000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  salaryMax?: number;

  @ApiPropertyOptional({ description: "招聘人数", example: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  headcount?: number;

  @ApiPropertyOptional({ description: "工作地点", example: "北京" })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: "职位要求" })
  @IsOptional()
  @IsString()
  requirements?: string;

  @ApiPropertyOptional({ description: "部门 ID" })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ description: "汇报对象 ID" })
  @IsOptional()
  @IsString()
  reportsToId?: string;
}

export class UpdatePositionDto {
  @ApiPropertyOptional({ description: "职位名称" })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: "职位描述" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: "最低薪资" })
  @IsOptional()
  @IsInt()
  @Min(0)
  salaryMin?: number;

  @ApiPropertyOptional({ description: "最高薪资" })
  @IsOptional()
  @IsInt()
  @Min(0)
  salaryMax?: number;

  @ApiPropertyOptional({ description: "招聘人数" })
  @IsOptional()
  @IsInt()
  @Min(1)
  headcount?: number;

  @ApiPropertyOptional({ description: "工作地点" })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: "职位要求" })
  @IsOptional()
  @IsString()
  requirements?: string;

  @ApiPropertyOptional({ description: "部门 ID" })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ description: "汇报对象 ID" })
  @IsOptional()
  @IsString()
  reportsToId?: string;

  @ApiPropertyOptional({
    description: "职位状态",
    enum: POSITION_STATUS_VALUES,
    example: "OPEN",
  })
  @IsOptional()
  @IsIn(POSITION_STATUS_VALUES)
  status?: PositionStatus;
}

export class PositionResponseDto {
  @ApiProperty({ description: "职位 ID" })
  id!: string;

  @ApiProperty({ description: "职位名称" })
  title!: string;

  @ApiProperty({ description: "职位描述", nullable: true })
  description!: string | null;

  @ApiProperty({ description: "最低薪资", nullable: true })
  salaryMin!: number | null;

  @ApiProperty({ description: "最高薪资", nullable: true })
  salaryMax!: number | null;

  @ApiProperty({ description: "招聘人数" })
  headcount!: number;

  @ApiProperty({ description: "已招聘人数" })
  hiredCount!: number;

  @ApiProperty({ description: "进行中申请数" })
  inProgressCount!: number;

  @ApiProperty({
    description: "职位状态",
    enum: POSITION_STATUS_VALUES,
  })
  status!: PositionStatus;

  @ApiProperty({ description: "工作地点", nullable: true })
  location!: string | null;

  @ApiProperty({ description: "职位要求", nullable: true })
  requirements!: string | null;

  @ApiProperty({ description: "创建时间" })
  createdAt!: Date;

  @ApiProperty({ description: "更新时间" })
  updatedAt!: Date;
}

export class PositionListResponseDto {
  @ApiProperty({ type: [PositionResponseDto] })
  items!: PositionResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  totalPages?: number;
}
