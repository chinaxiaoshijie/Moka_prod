import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { CreateUserDto, UpdateUserDto } from "./dto/user.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("users")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: "创建新用户 (HR权限)" })
  @ApiResponse({ status: 201, description: "用户创建成功" })
  @ApiResponse({ status: 400, description: "请求参数错误" })
  @ApiResponse({ status: 403, description: "无权限" })
  async create(@Body() createUserDto: CreateUserDto, @Request() req: any) {
    return this.usersService.create(createUserDto, req.user.sub);
  }

  @Get()
  @ApiOperation({ summary: "获取用户列表" })
  @ApiResponse({ status: 200, description: "用户列表" })
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "获取用户详情" })
  @ApiResponse({ status: 200, description: "用户详情" })
  @ApiResponse({ status: 404, description: "用户不存在" })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Put(":id")
  @ApiOperation({ summary: "更新用户信息 (HR权限)" })
  @ApiResponse({ status: 200, description: "用户更新成功" })
  @ApiResponse({ status: 400, description: "请求参数错误" })
  @ApiResponse({ status: 403, description: "无权限" })
  @ApiResponse({ status: 404, description: "用户不存在" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: any,
  ) {
    return this.usersService.update(id, updateUserDto, req.user.sub);
  }

  @Delete(":id")
  @ApiOperation({ summary: "删除用户 (HR权限)" })
  @ApiResponse({ status: 200, description: "用户删除成功" })
  @ApiResponse({ status: 400, description: "不能删除自己的账户" })
  @ApiResponse({ status: 403, description: "无权限" })
  @ApiResponse({ status: 404, description: "用户不存在" })
  async remove(@Param("id", ParseUUIDPipe) id: string, @Request() req: any) {
    return this.usersService.remove(id, req.user.sub);
  }
}
