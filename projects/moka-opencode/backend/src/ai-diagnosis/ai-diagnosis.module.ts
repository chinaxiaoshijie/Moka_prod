import { Module } from "@nestjs/common";
import { AIDiagnosisController } from "./ai-diagnosis.controller";
import { AIDiagnosisService } from "./ai-diagnosis.service";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { EmailModule } from "../email/email.module";
import { SettingsModule } from "../settings/settings.module";

@Module({
  imports: [PrismaModule, AuthModule, EmailModule, SettingsModule],
  controllers: [AIDiagnosisController],
  providers: [AIDiagnosisService],
  exports: [AIDiagnosisService],
})
export class AIDiagnosisModule {}
