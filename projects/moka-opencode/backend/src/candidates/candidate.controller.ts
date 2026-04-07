import "multer";
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
  UseInterceptors,
  UploadedFile,
  Res,
  Req,
  UseGuards,
  Request,
} from "@nestjs/common";
import { Public } from "../common/decorators/public.decorator";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { Response } from "express";
import { CandidateService } from "./candidate.service";
import {
  ResumeParserService,
  ExtractedCandidateInfo,
} from "./resume-parser.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  CreateCandidateDto,
  UpdateCandidateDto,
  CandidateResponseDto,
  CandidateListResponseDto,
} from "./dto/candidate.dto";

export interface ParseResumeResponse {
  success: boolean;
  data?: ExtractedCandidateInfo;
  error?: string;
}

@ApiTags("candidates")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("candidates")
export class CandidateController {
  constructor(
    private candidateService: CandidateService,
    private resumeParserService: ResumeParserService,
  ) {}

  @Get()
  @ApiOperation({ summary: "获取候选人列表" })
  async findAll(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query("pageSize", new DefaultValuePipe(10), ParseIntPipe)
    pageSize?: number,
    @Query("search") search?: string,
    @Query("status") status?: string,
    @Query("positionId") positionId?: string,
  ): Promise<CandidateListResponseDto> {
    return this.candidateService.findAll(
      page,
      pageSize,
      search,
      status,
      positionId,
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "获取单个候选人" })
  async findOne(@Param("id") id: string): Promise<CandidateResponseDto> {
    try {
      return await this.candidateService.findOne(id);
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Post()
  @ApiOperation({ summary: "创建候选人" })
  async create(
    @Body() createDto: CreateCandidateDto,
  ): Promise<CandidateResponseDto> {
    return await this.candidateService.create(createDto);
  }

  @Put(":id")
  @ApiOperation({ summary: "更新候选人" })
  async update(
    @Param("id") id: string,
    @Body() updateDto: UpdateCandidateDto,
  ): Promise<CandidateResponseDto> {
    try {
      return await this.candidateService.update(id, updateDto);
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Delete(":id")
  @ApiOperation({ summary: "删除候选人" })
  async remove(@Param("id") id: string): Promise<CandidateResponseDto> {
    try {
      return await this.candidateService.remove(id);
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Post("parse-resume")
  @ApiOperation({ summary: "解析简历PDF文件，提取候选人信息" })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file"))
  async parseResume(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ParseResumeResponse> {
    if (!file) {
      throw new HttpException("请上传PDF文件", HttpStatus.BAD_REQUEST);
    }

    if (file.mimetype !== "application/pdf") {
      throw new HttpException("只支持PDF格式文件", HttpStatus.BAD_REQUEST);
    }

    try {
      const text = await this.resumeParserService.parsePdf(file.buffer);
      const info = this.resumeParserService.extractCandidateInfo(text);

      return {
        success: true,
        data: info,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post(":id/resumes")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "上传候选人简历文件" })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file"))
  async uploadResume(
    @Param("id") candidateId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new HttpException("请上传文件", HttpStatus.BAD_REQUEST);
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new HttpException(
        "只支持PDF、Word(DOC/DOCX)、图片(JPG/PNG)格式文件",
        HttpStatus.BAD_REQUEST,
      );
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new HttpException("文件大小不能超过10MB", HttpStatus.BAD_REQUEST);
    }

    const uploadedBy = req.user?.sub;
    return await this.candidateService.uploadResume(
      candidateId,
      file,
      uploadedBy,
    );
  }

  @Get(":id/resumes")
  @ApiOperation({ summary: "获取候选人的简历文件列表" })
  async getResumes(@Param("id") candidateId: string) {
    return await this.candidateService.getResumes(candidateId);
  }

  @Get("public/resumes/:resumeId")
  @ApiOperation({ summary: "公开下载简历文件（无需认证）" })
  @Public()  // 跳过认证
  async downloadResumePublic(
    @Param("resumeId") resumeId: string,
    @Res() res: Response,
  ) {
    const resume = await this.candidateService.getResumeFile(resumeId);
    
    res.setHeader("Content-Type", resume.fileType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(resume.fileName)}"`,
    );
    
    const fs = await import("fs");
    const fileStream = fs.createReadStream(resume.filePath);
    fileStream.pipe(res);
  }

  @Get(":id/resumes/:resumeId")
  @ApiOperation({ summary: "下载或预览简历文件" })
  async downloadResume(
    @Param("id") candidateId: string,
    @Param("resumeId") resumeId: string,
    @Res() res: Response,
  ) {
    const resume = await this.candidateService.getResumeFile(resumeId);

    res.setHeader("Content-Type", resume.fileType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(resume.fileName)}"`,
    );

    const fs = await import("fs");
    const fileStream = fs.createReadStream(resume.filePath);
    fileStream.pipe(res);
  }

  @Delete("resumes/:resumeId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "删除简历文件" })
  async deleteResume(@Param("resumeId") resumeId: string) {
    return await this.candidateService.deleteResume(resumeId);
  }

  @Put("resumes/:resumeId/activate")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "设置简历为当前使用版本" })
  async activateResume(
    @Param("resumeId") resumeId: string,
    @Param() params: any,
  ) {
    const candidateId = params.candidateId || params[0];
    return await this.candidateService.activateResume(resumeId, candidateId);
  }

  @Get("check-duplicate")
  @ApiOperation({ summary: "检查候选人是否重复（根据姓名+电话）" })
  async checkDuplicate(
    @Query("name") name: string,
    @Query("phone") phone: string,
    @Query("excludeId") excludeId?: string,
  ) {
    if (!name || !phone) {
      throw new HttpException("请提供姓名和电话", HttpStatus.BAD_REQUEST);
    }

    return await this.candidateService.checkDuplicate(name, phone, excludeId);
  }

  @Post(":id/mentions")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "@面试官查看候选人简历" })
  async mentionInterviewer(
    @Param("id") candidateId: string,
    @Body() body: { interviewerId: string; message?: string },
    @Req() req: any,
  ) {
    if (!body.interviewerId) {
      throw new HttpException("请选择面试官", HttpStatus.BAD_REQUEST);
    }

    const mentionedBy = req.user?.sub;
    if (!mentionedBy) {
      throw new HttpException("无法获取用户信息", HttpStatus.UNAUTHORIZED);
    }

    return await this.candidateService.mentionInterviewer(
      candidateId,
      body.interviewerId,
      mentionedBy,
      body.message,
    );
  }

  @Get(":id/mentions")
  @ApiOperation({ summary: "获取候选人的@记录列表" })
  async getMentions(@Param("id") candidateId: string) {
    return await this.candidateService.getMentions(candidateId);
  }

  @Get("my-mentions")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "获取当前用户的@记录（被@的记录）" })
  async getMyMentions(@Req() req: any, @Query("status") status?: string) {
    const interviewerId = req.user?.sub;
    return await this.candidateService.getMentionsByInterviewer(
      interviewerId,
      status,
    );
  }

  @Put("mentions/:mentionId/view")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "标记@记录为已查看" })
  async viewMention(@Param("mentionId") mentionId: string) {
    return await this.candidateService.viewMention(mentionId);
  }

  @Put("mentions/:mentionId/respond")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "回复@记录（合适/不合适）" })
  async respondMention(
    @Param("mentionId") mentionId: string,
    @Body() body: { suitable: boolean; comment?: string },
  ) {
    return await this.candidateService.respondMention(
      mentionId,
      body.suitable,
      body.comment,
    );
  }

  @Get(":id/status-history")
  @ApiOperation({ summary: "获取候选人状态变更历史" })
  async getStatusHistory(@Param("id") candidateId: string) {
    return await this.candidateService.getStatusHistory(candidateId);
  }
}
