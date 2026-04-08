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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { PositionService } from "./position.service";
import {
  CreatePositionDto,
  UpdatePositionDto,
  PositionResponseDto,
  PositionListResponseDto,
} from "./dto/position.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@ApiTags("positions")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("positions")
export class PositionController {
  constructor(private positionService: PositionService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "获取职位列表" })
  @ApiResponse({ status: 200, type: PositionListResponseDto })
  async findAll(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query("pageSize", new DefaultValuePipe(10), ParseIntPipe)
    pageSize?: number,
  ): Promise<PositionListResponseDto> {
    return this.positionService.findAll(page, pageSize);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "获取单个职位" })
  @ApiResponse({ status: 200, type: PositionResponseDto })
  @ApiResponse({ status: 404, description: "职位不存在" })
  async findOne(@Param("id") id: string): Promise<PositionResponseDto> {
    try {
      return await this.positionService.findOne(id);
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Post()
  @Roles("admin", "hr")
  @ApiOperation({ summary: "创建职位" })
  @ApiResponse({ status: 201, type: PositionResponseDto })
  @ApiResponse({ status: 400, description: "请求参数错误" })
  @ApiResponse({ status: 403, description: "权限不足" })
  async create(
    @Body() createPositionDto: CreatePositionDto,
  ): Promise<PositionResponseDto> {
    return await this.positionService.create(createPositionDto);
  }

  @Put(":id")
  @Roles("admin", "hr")
  @ApiOperation({ summary: "更新职位" })
  @ApiResponse({ status: 200, type: PositionResponseDto })
  @ApiResponse({ status: 404, description: "职位不存在" })
  @ApiResponse({ status: 403, description: "权限不足" })
  async update(
    @Param("id") id: string,
    @Body() updatePositionDto: UpdatePositionDto,
  ): Promise<PositionResponseDto> {
    try {
      return await this.positionService.update(id, updatePositionDto);
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Delete(":id")
  @Roles("admin")
  @ApiOperation({ summary: "删除职位" })
  @ApiResponse({ status: 200, type: PositionResponseDto })
  @ApiResponse({ status: 404, description: "职位不存在" })
  @ApiResponse({ status: 403, description: "权限不足" })
  async remove(@Param("id") id: string): Promise<PositionResponseDto> {
    try {
      return await this.positionService.remove(id);
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }
}
