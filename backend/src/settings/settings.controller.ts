import { Controller, Get, Put, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { SettingsService } from "./settings.service";

@ApiTags("settings")
@Controller("settings")
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  @Roles("HR", "ADMIN")
  @ApiOperation({ summary: "获取所有系统设置" })
  async getAll() {
    return this.settingsService.getAll();
  }

  @Get("ai-model")
  @Roles("HR", "ADMIN")
  @ApiOperation({ summary: "获取AI诊断模型设置" })
  async getAiModel() {
    const value = await this.settingsService.get("ai_diagnosis_model");
    return { model: value || "qwen-plus" };
  }

  @Put("ai-model")
  @Roles("HR", "ADMIN")
  @ApiOperation({ summary: "设置AI诊断模型" })
  async setAiModel(@Body() body: { model: string }) {
    await this.settingsService.set("ai_diagnosis_model", body.model, "AI诊断使用的模型");
    return { success: true, model: body.model };
  }
}
