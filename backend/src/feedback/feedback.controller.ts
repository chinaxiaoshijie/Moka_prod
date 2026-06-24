import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  HttpException,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { FeedbackService } from "./feedback.service";
import {
  CreateFeedbackDto,
  UpdateFeedbackDto,
  FeedbackResponseDto,
  FeedbackListResponseDto,
  InterviewFeedbackSummaryDto,
} from "./dto/feedback.dto";

@ApiTags("feedback")
@Controller("feedback")
@UseGuards(JwtAuthGuard)
export class FeedbackController {
  constructor(private feedbackService: FeedbackService) {}

  @Get()
  @ApiOperation({ summary: "获取所有面试反馈" })
  async findAll(): Promise<FeedbackListResponseDto> {
    return this.feedbackService.findAll();
  }

  @Get("interview/:interviewId")
  @ApiOperation({ summary: "获取特定面试的所有反馈" })
  async findByInterview(
    @Param("interviewId") interviewId: string,
  ): Promise<InterviewFeedbackSummaryDto> {
    try {
      return await this.feedbackService.findByInterview(interviewId);
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Get("my-feedbacks")
  @ApiOperation({ summary: "获取当前面试官的所有反馈" })
  async findByInterviewer(@Req() req: any): Promise<FeedbackListResponseDto> {
    const interviewerId = req.user.sub;
    return this.feedbackService.findByInterviewer(interviewerId);
  }

  @Post()
  @ApiOperation({ summary: "提交面试反馈" })
  async create(
    @Req() req: any,
    @Body() createDto: CreateFeedbackDto,
  ): Promise<FeedbackResponseDto> {
    try {
      const interviewerId = req.user.sub;
      if (!interviewerId) {
        throw new Error("缺少面试官ID");
      }
      return await this.feedbackService.create(interviewerId, createDto);
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put(":id")
  @ApiOperation({ summary: "更新反馈" })
  async update(
    @Param("id") id: string,
    @Req() req: any,
    @Body() updateDto: UpdateFeedbackDto,
  ): Promise<FeedbackResponseDto> {
    try {
      const interviewerId = req.user.sub;
      return await this.feedbackService.update(id, interviewerId, updateDto);
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Delete(":id")
  @ApiOperation({ summary: "删除反馈" })
  async remove(@Param("id") id: string, @Req() req: any): Promise<void> {
    try {
      const interviewerId = req.user.sub;
      await this.feedbackService.remove(id, interviewerId);
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }
}
