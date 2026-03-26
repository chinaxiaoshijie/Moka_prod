import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  HttpException,
  HttpStatus,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { InterviewProcessService } from "./interview-process.service";
import {
  CreateInterviewProcessDto,
  CreateRoundInterviewDto,
  UpdateRoundConfigDto,
  ProcessResponseDto,
  ProcessListResponseDto,
} from "./dto/interview-process.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("interview-processes")
@Controller("interview-processes")
@UseGuards(JwtAuthGuard, RolesGuard)
export class InterviewProcessController {
  constructor(private processService: InterviewProcessService) {}

  @Post()
  @Roles("HR")
  @ApiOperation({ summary: "创建面试流程（HR启动流程）" })
  async create(
    @Body() createDto: CreateInterviewProcessDto,
    @Request() req: any,
  ): Promise<ProcessResponseDto> {
    return await this.processService.create(createDto, req.user.sub);
  }

  @Post(":id/rounds/:roundNumber/interview")
  @Roles("HR")
  @ApiOperation({ summary: "为指定轮次创建面试安排（HR安排面试）" })
  async createRoundInterview(
    @Param("id") processId: string,
    @Param("roundNumber", ParseIntPipe) roundNumber: number,
    @Body() createDto: CreateRoundInterviewDto,
  ): Promise<ProcessResponseDto> {
    try {
      return await this.processService.createRoundInterview(
        processId,
        roundNumber,
        createDto,
      );
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post(":id/complete-round")
  @Roles("HR")
  @ApiOperation({ summary: "HR确认当前轮次完成并决定下一步" })
  async completeRoundAndProceed(
    @Param("id") processId: string,
    @Body("action") action: "next" | "complete" | "reject",
    @Request() req: any,
  ): Promise<ProcessResponseDto> {
    try {
      return await this.processService.completeRoundAndProceed(
        processId,
        action,
        req.user.sub,
      );
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put(":id/rounds/:roundNumber/config")
  @Roles("HR")
  @ApiOperation({ summary: "更新未来轮次面试官配置" })
  async updateRoundConfig(
    @Param("id") processId: string,
    @Param("roundNumber", ParseIntPipe) roundNumber: number,
    @Body() updateDto: UpdateRoundConfigDto,
  ): Promise<ProcessResponseDto> {
    try {
      return await this.processService.updateRoundConfig(
        processId,
        roundNumber,
        updateDto,
      );
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  @Roles("HR", "INTERVIEWER")
  @ApiOperation({ summary: "获取面试流程列表" })
  async findAll(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query("pageSize", new DefaultValuePipe(10), ParseIntPipe)
    pageSize?: number,
    @Query("status") status?: string,
  ): Promise<ProcessListResponseDto> {
    return this.processService.findAll(page, pageSize, status);
  }

  @Get(":id")
  @Roles("HR", "INTERVIEWER")
  @ApiOperation({ summary: "获取面试流程详情" })
  async findOne(@Param("id") id: string): Promise<ProcessResponseDto> {
    try {
      return await this.processService.findOne(id);
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Put(":id/cancel")
  @Roles("HR")
  @ApiOperation({ summary: "取消面试流程" })
  async cancel(@Param("id") id: string): Promise<ProcessResponseDto> {
    try {
      return await this.processService.cancel(id);
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }
}
