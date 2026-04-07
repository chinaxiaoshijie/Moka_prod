import { Module } from "@nestjs/common";
import { EmailService } from "./email.service";
import { EmailLimitService } from "./email-limit.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  providers: [EmailService, EmailLimitService],
  exports: [EmailService, EmailLimitService],
  imports: [PrismaModule],
})
export class EmailModule {}
