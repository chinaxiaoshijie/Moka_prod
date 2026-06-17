import { Module } from "@nestjs/common";
import { InterviewService } from "./interview.service";
import { InterviewController } from "./interview.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { EmailModule } from "../email/email.module";
import { NotificationModule } from "../notifications/notification.module";
import { FeishuCalendarModule } from "../feishu/feishu-calendar.module";

@Module({
  imports: [PrismaModule, AuthModule, EmailModule, NotificationModule, FeishuCalendarModule],
  controllers: [InterviewController],
  providers: [InterviewService],
  exports: [InterviewService],
})
export class InterviewsModule {}
