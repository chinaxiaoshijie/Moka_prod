import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";
import { AuthModule } from "./auth/auth.module";
import { PrismaModule } from "./prisma/prisma.module";
import { PositionsModule } from "./positions/positions.module";
import { CandidatesModule } from "./candidates/candidates.module";
import { InterviewsModule } from "./interviews/interviews.module";
import { FeedbackModule } from "./feedback/feedback.module";
import { InterviewProcessModule } from "./interview-processes/interview-process.module";
import { EmailModule } from "./email/email.module";
import { NotificationModule } from "./notifications/notification.module";
import { AnalyticsModule } from "./analytics/analytics.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: "env/.env",
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "uploads"),
      serveRoot: "/uploads",
    }),
    PrismaModule,
    AuthModule,
    PositionsModule,
    CandidatesModule,
    InterviewsModule,
    FeedbackModule,
    InterviewProcessModule,
    EmailModule,
    NotificationModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
