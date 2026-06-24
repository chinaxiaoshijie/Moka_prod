import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AnalyticsService } from "./analytics.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("analytics")
@Controller("analytics")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get("funnel")
  @ApiOperation({ summary: "获取招聘漏斗数据" })
  async getRecruitmentFunnel() {
    return this.analyticsService.getRecruitmentFunnel();
  }

  @Get("interviewers")
  @ApiOperation({ summary: "获取面试官工作量统计" })
  async getInterviewerStats() {
    return this.analyticsService.getInterviewerStats();
  }

  @Get("sources")
  @ApiOperation({ summary: "获取候选人来源分析" })
  async getSourceAnalysis() {
    return this.analyticsService.getSourceAnalysis();
  }

  @Get("timeline")
  @ApiOperation({ summary: "获取招聘时间线" })
  async getHiringTimeline(@Query("days") days?: string) {
    return this.analyticsService.getHiringTimeline(days ? parseInt(days) : 30);
  }

  @Get("hiring-cycle")
  @ApiOperation({ summary: "获取平均招聘周期" })
  async getAverageHiringCycle() {
    return this.analyticsService.getAverageHiringCycle();
  }

  @Get("dashboard")
  @ApiOperation({ summary: "获取仪表盘统计数据" })
  async getDashboardStats() {
    return this.analyticsService.getDashboardStats();
  }
}
