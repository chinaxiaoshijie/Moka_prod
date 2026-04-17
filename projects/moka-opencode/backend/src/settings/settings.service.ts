import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private prisma: PrismaService) {}

  async get(key: string): Promise<string | null> {
    const setting = await this.prisma.systemSetting.findUnique({ where: { key } });
    return setting?.value ?? null;
  }

  async set(key: string, value: string, description?: string): Promise<void> {
    await this.prisma.systemSetting.upsert({
      where: { key },
      create: { key, value, description: description || "" },
      update: { value },
    });
    this.logger.log(`设置已更新: ${key} = ${value}`);
  }

  async getAll(): Promise<{ key: string; value: string; description: string }[]> {
    return this.prisma.systemSetting.findMany({ orderBy: { key: "asc" } });
  }
}
