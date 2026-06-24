import { Module } from "@nestjs/common";
import { FeedbackService } from "./feedback.service";
import { FeedbackController } from "./feedback.controller";
import { FeedbackPublicController } from "./feedback-public.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { InterviewProcessModule } from "../interview-processes/interview-process.module";
import { AuthModule } from "../auth/auth.module";
import { EmailModule } from "../email/email.module";
import { CandidatesModule } from "../candidates/candidates.module";
import { AIDiagnosisModule } from "../ai-diagnosis/ai-diagnosis.module";

@Module({
  imports: [
    PrismaModule,
    InterviewProcessModule,
    AIDiagnosisModule,
    EmailModule,
    CandidatesModule,
    AuthModule,
  ],
  controllers: [FeedbackController, FeedbackPublicController],
  providers: [FeedbackService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
