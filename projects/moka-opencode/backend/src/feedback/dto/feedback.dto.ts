import { IsString, IsOptional, IsIn, IsInt, Min, Max } from "class-validator";

// 使用字符串字面量而非 Prisma 枚举
export type FeedbackResult = "PASS" | "FAIL" | "PENDING";
export const FEEDBACK_RESULT_VALUES = ["PASS", "FAIL", "PENDING"] as const;

export class CreateFeedbackDto {
  @IsString()
  interviewId!: string;

  @IsIn(FEEDBACK_RESULT_VALUES, {
    message: "反馈结果必须是 PASS, FAIL 或 PENDING",
  })
  result!: FeedbackResult;

  @IsOptional()
  @IsString()
  strengths?: string;

  @IsOptional()
  @IsString()
  weaknesses?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  overallRating?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateFeedbackDto {
  @IsOptional()
  @IsIn(FEEDBACK_RESULT_VALUES, {
    message: "反馈结果必须是 PASS, FAIL 或 PENDING",
  })
  result?: FeedbackResult;

  @IsOptional()
  @IsString()
  strengths?: string;

  @IsOptional()
  @IsString()
  weaknesses?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  overallRating?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class FeedbackResponseDto {
  id!: string;
  interviewId!: string;
  interview!: {
    candidate: { name: string };
    position: { title: string };
    type: string;
  };
  interviewerId!: string;
  interviewer!: { name: string };
  result!: FeedbackResult;
  strengths!: string | null;
  weaknesses!: string | null;
  overallRating!: number | null;
  notes!: string | null;
  createdAt!: Date;
}

export class FeedbackListResponseDto {
  items!: FeedbackResponseDto[];
  total!: number;
}

export class InterviewFeedbackSummaryDto {
  interviewId!: string;
  candidateName!: string;
  positionTitle!: string;
  interviewType!: string;
  feedbacks!: FeedbackResponseDto[];
  averageRating!: number | null;
  finalResult!: string;
}
