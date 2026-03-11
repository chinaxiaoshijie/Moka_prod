import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { InterviewProcessController } from "./interview-process.controller";
import { InterviewProcessService } from "./interview-process.service";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { EmailModule } from "../email/email.module";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    EmailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET") || "dev-secret",
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [InterviewProcessController],
  providers: [InterviewProcessService],
  exports: [InterviewProcessService],
})
export class InterviewProcessModule {}
