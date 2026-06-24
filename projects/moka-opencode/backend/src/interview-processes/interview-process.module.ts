import { Module } from "@nestjs/common";
import { InterviewProcessController } from "./interview-process.controller";
import { InterviewProcessService } from "./interview-process.service";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { EmailModule } from "../email/email.module";
import { CandidatesModule } from "../candidates/candidates.module";
import { NotificationModule } from "../notifications/notification.module";
import { FeishuCalendarModule } from "../feishu/feishu-calendar.module";
import { AIDiagnosisModule } from "../ai-diagnosis/ai-diagnosis.module";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    EmailModule,
    CandidatesModule,
    NotificationModule,
    FeishuCalendarModule,
    AIDiagnosisModule,
  ],
  controllers: [InterviewProcessController],
  providers: [InterviewProcessService],
  exports: [InterviewProcessService],
})
export class InterviewProcessModule {}
