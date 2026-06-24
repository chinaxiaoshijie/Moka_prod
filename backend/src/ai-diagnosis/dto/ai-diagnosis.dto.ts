import { IsString, IsOptional, IsNumber, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TriggerDiagnosisResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  processId!: string;

  @ApiProperty()
  roundNumber!: number;

  @ApiPropertyOptional()
  matchScore?: number;

  @ApiPropertyOptional()
  matchLevel?: string;

  @ApiProperty({ type: [String] })
  strengths!: string[];

  @ApiProperty({ type: [String] })
  weaknesses!: string[];

  @ApiProperty({ type: [String] })
  suggestions!: string[];

  @ApiProperty({ type: [String] })
  questions!: string[];

  @ApiProperty()
  summary!: string;

  @ApiProperty()
  analyzedAt!: Date;
}

export class ShareDiagnosisDto {
  @ApiProperty({ description: '收件人（面试官）ID' })
  @IsString()
  interviewerId!: string;

  @ApiPropertyOptional({ description: '自定义邮件内容' })
  @IsString()
  @IsOptional()
  customMessage?: string;
}

export class ShareDiagnosisResponseDto {
  @ApiProperty({ description: '是否发送成功' })
  success!: boolean;

  @ApiProperty({ description: '收件人邮箱' })
  recipientEmail!: string;
}
