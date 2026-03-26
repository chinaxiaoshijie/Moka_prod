import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  HttpException,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { InterviewService } from "./interview.service";
import {
  CreateInterviewDto,
  UpdateInterviewDto,
  InterviewResponseDto,
  InterviewListResponseDto,
} from "./dto/interview.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("interviews")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("interviews")
export class InterviewController {
  constructor(private interviewService: InterviewService) {}

  @Get()
  @ApiOperation({ summary: "获取面试列表" })
  async findAll(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query("pageSize", new DefaultValuePipe(10), ParseIntPipe) pageSize?: number,
  ): Promise<InterviewListResponseDto> {
    return this.interviewService.findAll(page, pageSize);
  }

  @Get(":id")
  @ApiOperation({ summary: "获取单个面试" })
  async findOne(@Param("id") id: string): Promise<InterviewResponseDto> {
    try {
      return await this.interviewService.findOne(id);
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Post()
  @ApiOperation({ summary: "创建面试" })
  async create(
    @Body() createDto: CreateInterviewDto,
  ): Promise<InterviewResponseDto> {
    return await this.interviewService.create(createDto);
  }

  @Put(":id")
  @ApiOperation({ summary: "更新面试" })
  async update(
    @Param("id") id: string,
    @Body() updateDto: UpdateInterviewDto,
  ): Promise<InterviewResponseDto> {
    try {
      return await this.interviewService.update(id, updateDto);
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Delete(":id")
  @ApiOperation({ summary: "删除面试" })
  async remove(@Param("id") id: string): Promise<InterviewResponseDto> {
    try {
      return await this.interviewService.remove(id);
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }
}
