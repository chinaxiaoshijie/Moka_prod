import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

// 使用字符串字面量而非 Prisma 枚举，因为 Prisma 枚举在运行时不可用
export type PositionStatus = "OPEN" | "PAUSED" | "CLOSED";
export const POSITION_STATUS_VALUES = ["OPEN", "PAUSED", "CLOSED"] as const;

export class CreatePositionDto {
  @ApiProperty({ description: "职位名称", example: "高级前端工程师" })
  title!: string;

  @ApiPropertyOptional({ description: "职位描述" })
  description?: string;

  @ApiPropertyOptional({ description: "最低薪资", example: 15000 })
  salaryMin?: number;

  @ApiPropertyOptional({ description: "最高薪资", example: 25000 })
  salaryMax?: number;

  @ApiPropertyOptional({ description: "招聘人数", example: 5 })
  headcount?: number;

  @ApiPropertyOptional({ description: "工作地点", example: "北京" })
  location?: string;

  @ApiPropertyOptional({ description: "职位要求" })
  requirements?: string;

  @ApiPropertyOptional({ description: "部门 ID" })
  departmentId?: string;

  @ApiPropertyOptional({ description: "汇报对象 ID" })
  reportsToId?: string;
}

export class UpdatePositionDto {
  @ApiPropertyOptional({ description: "职位名称" })
  title?: string;

  @ApiPropertyOptional({ description: "职位描述" })
  description?: string;

  @ApiPropertyOptional({ description: "最低薪资" })
  salaryMin?: number;

  @ApiPropertyOptional({ description: "最高薪资" })
  salaryMax?: number;

  @ApiPropertyOptional({ description: "招聘人数" })
  headcount?: number;

  @ApiPropertyOptional({ description: "工作地点" })
  location?: string;

  @ApiPropertyOptional({ description: "职位要求" })
  requirements?: string;

  @ApiPropertyOptional({ description: "部门 ID" })
  departmentId?: string;

  @ApiPropertyOptional({ description: "汇报对象 ID" })
  reportsToId?: string;

  @ApiPropertyOptional({
    description: "职位状态",
    enum: POSITION_STATUS_VALUES,
    example: "OPEN",
  })
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

  @ApiProperty({ description: "创建时间" })
  createdAt!: Date;

  @ApiProperty({ description: "更新时间" })
  updatedAt!: Date;
}

export class PositionListResponseDto {
  @ApiProperty({ description: "职位列表", type: [PositionResponseDto] })
  items!: PositionResponseDto[];

  @ApiProperty({ description: "总数", example: 100 })
  total!: number;

  @ApiProperty({ description: "当前页码", example: 1 })
  page!: number;

  @ApiProperty({ description: "每页数量", example: 10 })
  pageSize!: number;
}

export class PaginationQueryDto {
  @ApiPropertyOptional({ description: "页码", example: 1, default: 1 })
  page?: number;

  @ApiPropertyOptional({ description: "每页数量", example: 10, default: 10 })
  pageSize?: number;
}
