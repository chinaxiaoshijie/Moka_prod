import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private prisma: PrismaService) {}

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  private setCache<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL,
    });
    this.logger.debug(`Cache set: ${key}`);
  }

  private invalidateCache(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key);
        this.logger.debug(`Cache invalidated: ${key}`);
      }
    }
  }

  async getRecruitmentFunnel() {
    const cacheKey = "analytics:funnel";
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit: ${cacheKey}`);
      return cached;
    }

    const [
      totalCandidates,
      screeningCandidates,
      interview1Candidates,
      interview2Candidates,
      interview3Candidates,
      hiredCandidates,
      rejectedCandidates,
    ] = await Promise.all([
      this.prisma.candidate.count(),
      this.prisma.candidate.count({ where: { status: "SCREENING" } }),
      this.prisma.candidate.count({ where: { status: "INTERVIEW_1" } }),
      this.prisma.candidate.count({ where: { status: "INTERVIEW_2" } }),
      this.prisma.candidate.count({ where: { status: "INTERVIEW_3" } }),
      this.prisma.candidate.count({ where: { status: "HIRED" } }),
      this.prisma.candidate.count({ where: { status: "REJECTED" } }),
    ]);

    const result = {
      stages: [
        { name: "新增候选人", count: totalCandidates },
        { name: "筛选中", count: screeningCandidates },
        { name: "初试", count: interview1Candidates },
        { name: "复试", count: interview2Candidates },
        { name: "终试", count: interview3Candidates },
        { name: "已录用", count: hiredCandidates },
        { name: "已拒绝", count: rejectedCandidates },
      ],
      conversionRate:
        totalCandidates > 0
          ? ((hiredCandidates / totalCandidates) * 100).toFixed(2)
          : 0,
    };

    this.setCache(cacheKey, result);
    return result;
  }

  async getInterviewerStats() {
    const interviewers = await this.prisma.user.findMany({
      where: { role: "INTERVIEWER" },
      select: {
        id: true,
        name: true,
      },
    });

    const stats = await Promise.all(
      interviewers.map(async (interviewer) => {
        const [totalInterviews, completedInterviews, feedbacks] =
          await Promise.all([
            this.prisma.interview.count({
              where: { interviewerId: interviewer.id },
            }),
            this.prisma.interview.count({
              where: {
                interviewerId: interviewer.id,
                status: "COMPLETED",
              },
            }),
            this.prisma.interviewFeedback.findMany({
              where: { interviewerId: interviewer.id },
              select: { result: true, overallRating: true },
            }),
          ]);

        const passCount = feedbacks.filter((f) => f.result === "PASS").length;
        const failCount = feedbacks.filter((f) => f.result === "FAIL").length;
        const avgRating =
          feedbacks.length > 0
            ? (
                feedbacks.reduce((sum, f) => sum + (f.overallRating || 0), 0) /
                feedbacks.length
              ).toFixed(1)
            : 0;

        return {
          interviewerId: interviewer.id,
          name: interviewer.name,
          totalInterviews,
          completedInterviews,
          pendingInterviews: totalInterviews - completedInterviews,
          passCount,
          failCount,
          passRate:
            passCount + failCount > 0
              ? ((passCount / (passCount + failCount)) * 100).toFixed(1)
              : 0,
          averageRating: avgRating,
        };
      }),
    );

    return stats;
  }

  async getSourceAnalysis() {
    const sources = await this.prisma.candidate.groupBy({
      by: ["source"],
      _count: { id: true },
    });

    return sources.map((s) => ({
      source: s.source || "未知",
      count: s._count.id,
    }));
  }

  async getHiringTimeline(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const candidates = await this.prisma.candidate.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        status: true,
      },
    });

    const timeline: {
      [key: string]: { date: string; new: number; hired: number };
    } = {};

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      timeline[dateStr] = { date: dateStr, new: 0, hired: 0 };
    }

    candidates.forEach((c) => {
      const dateStr = c.createdAt.toISOString().split("T")[0];
      if (timeline[dateStr]) {
        timeline[dateStr].new++;
      }
      if (c.status === "HIRED") {
        const hireDateStr = c.createdAt.toISOString().split("T")[0];
        if (timeline[hireDateStr]) {
          timeline[hireDateStr].hired++;
        }
      }
    });

    return Object.values(timeline).reverse();
  }

  async getAverageHiringCycle() {
    const hiredCandidates = await this.prisma.candidate.findMany({
      where: { status: "HIRED" },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    });

    if (hiredCandidates.length === 0) {
      return { averageDays: 0, total: 0 };
    }

    const totalDays = hiredCandidates.reduce((sum, c) => {
      const diff =
        c.updatedAt.getTime() - c.createdAt.getTime() / (1000 * 60 * 60 * 24);
      return sum + diff;
    }, 0);

    return {
      averageDays: (totalDays / hiredCandidates.length).toFixed(1),
      total: hiredCandidates.length,
    };
  }

  async getDashboardStats() {
    const cacheKey = "analytics:dashboard";
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit: ${cacheKey}`);
      return cached;
    }

    const [
      totalCandidates,
      pendingCandidates,
      hiredThisMonth,
      totalInterviews,
      upcomingInterviews,
    ] = await Promise.all([
      this.prisma.candidate.count(),
      this.prisma.candidate.count({ where: { status: "PENDING" } }),
      this.prisma.candidate.count({
        where: {
          status: "HIRED",
          updatedAt: {
            gte: new Date(new Date().setDate(1)),
          },
        },
      }),
      this.prisma.interview.count(),
      this.prisma.interview.count({
        where: {
          startTime: { gte: new Date() },
          status: "SCHEDULED",
        },
      }),
    ]);

    const result = {
      totalCandidates,
      pendingCandidates,
      hiredThisMonth,
      totalInterviews,
      upcomingInterviews,
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * 清除分析缓存（在数据变更时调用）
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.log("Analytics cache cleared");
  }
}
