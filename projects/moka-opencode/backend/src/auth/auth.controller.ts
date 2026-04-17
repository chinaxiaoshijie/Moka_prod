import {
  Controller,
  Post,
  Put,
  Body,
  Get,
  UseGuards,
  Request,
  Query,
  Res,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto, AuthResponseDto } from "./dto/login.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { FeishuOAuthService } from "../feishu/feishu-oauth.service";
import { PrismaService } from "../prisma/prisma.service";
import { Response } from "express";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private feishuOAuthService: FeishuOAuthService,
    private prisma: PrismaService,
  ) {}

  @Post("login")
  @ApiOperation({ summary: "用户登录" })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 401, description: "用户名或密码错误" })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "获取当前用户信息" })
  @ApiResponse({ status: 200 })
  async getProfile(@Request() req: any) {
    return this.authService.validateUser(req.user.sub);
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "登出" })
  @ApiResponse({ status: 200 })
  async logout() {
    return { message: "Successfully logged out" };
  }

  @Get("users")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "获取用户列表" })
  async getUsers(@Query("role") role?: string) {
    return this.authService.findUsers(role);
  }

  @Put("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "更新个人信息" })
  async updateProfile(
    @Request() req: any,
    @Body() body: { name?: string; email?: string },
  ) {
    return this.authService.updateProfile(req.user.sub, body);
  }

  @Post("change-password")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "修改密码" })
  async changePassword(
    @Request() req: any,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(
      req.user.sub,
      body.currentPassword,
      body.newPassword,
    );
  }

  // ==================== 飞书 OAuth 绑定 ====================

  /**
   * GET /auth/feishu/oauth-url — 获取飞书 OAuth 授权 URL
   */
  @Get("feishu/oauth-url")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "获取飞书 OAuth 授权 URL" })
  async getFeishuOAuthUrl(@Request() req: any) {
    const state = this.feishuOAuthService.generateState(req.user.sub);
    const url = this.feishuOAuthService.getAuthorizeUrl(state);
    return { url, state };
  }

  /**
   * POST /auth/feishu/callback — 处理飞书 OAuth 回调
   * 前端回调页面 (/feishu-callback.html) 提交 code + state 到此端点
   */
  @Post("feishu/callback")
  @ApiOperation({ summary: "飞书 OAuth 回调处理" })
  async feishuCallback(
    @Body() body: { code: string; state: string },
    @Res() res: Response,
  ) {
    const { code, state } = body;

    if (!code || !state) {
      return res.status(400).json({
        success: false,
        message: "缺少 code 或 state 参数",
      });
    }

    // 1. 用 code 交换用户信息
    const userInfo = await this.feishuOAuthService.exchangeCode(code);
    if (!userInfo) {
      return res.status(400).json({
        success: false,
        message: "飞书授权失败，请重试",
      });
    }

    // 2. 存储结果供前端轮询获取
    this.feishuOAuthService.storeCompletedState(state, userInfo);

    return res.json({
      success: true,
      openId: userInfo.openId,
      name: userInfo.name,
      avatarUrl: userInfo.avatarUrl,
    });
  }

  /**
   * POST /auth/feishu/bind — 完成飞书账号绑定（需要 JWT）
   * 前端在 OAuth 回调成功后调用此端点，将 open_id 绑定到当前用户
   */
  @Post("feishu/bind")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "绑定飞书账号到当前用户" })
  async bindFeishu(
    @Request() req: any,
    @Body() body: { openId: string },
  ) {
    const userId = req.user.sub;
    const { openId } = body;

    if (!openId) {
      return { success: false, message: "缺少 openId" };
    }

    // 检查 openId 是否已被其他用户绑定
    const existingUser = await this.prisma.user.findFirst({
      where: { feishuOuId: { equals: openId } },
    });
    if (existingUser && existingUser.id !== userId) {
      return {
        success: false,
        message: `该飞书账号已绑定给用户「${existingUser.name}」`,
      };
    }

    // 绑定到当前用户
    await this.prisma.user.update({
      where: { id: userId },
      data: { feishuOuId: openId },
    });

    return {
      success: true,
      message: "飞书账号绑定成功",
      openId,
    };
  }

  /**
   * DELETE /auth/feishu/unbind — 解绑飞书账号
   */
  @Post("feishu/unbind")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "解绑飞书账号" })
  async unbindFeishu(@Request() req: any) {
    const userId = req.user.sub;

    await this.prisma.user.update({
      where: { id: userId },
      data: { feishuOuId: null },
    });

    return { success: true, message: "飞书账号已解绑" };
  }
}
