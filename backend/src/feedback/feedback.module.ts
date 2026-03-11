import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { FeedbackService } from "./feedback.service";
import { FeedbackController } from "./feedback.controller";
import { FeedbackPublicController } from "./feedback-public.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { InterviewProcessModule } from "../interview-processes/interview-process.module";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { EmailModule } from "../email/email.module";
import { CandidatesModule } from "../candidates/candidates.module";

@Module({
  imports: [
    PrismaModule,
    InterviewProcessModule,
    EmailModule,
    CandidatesModule,
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET") || "dev-secret",
        signOptions: {
          expiresIn: (configService.get<string>("JWT_EXPIRES_IN") ||
            "7d") as any,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [FeedbackController, FeedbackPublicController],
  providers: [FeedbackService, JwtAuthGuard],
  exports: [FeedbackService],
})
export class FeedbackModule {}
