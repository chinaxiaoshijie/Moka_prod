import { Module } from "@nestjs/common";
import { CandidateService } from "./candidate.service";
import { CandidateController } from "./candidate.controller";
import { ResumeParserService } from "./resume-parser.service";
import { CandidateStatusService } from "./candidate-status.service";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { EmailModule } from "../email/email.module";

@Module({
  imports: [PrismaModule, AuthModule, EmailModule],
  controllers: [CandidateController],
  providers: [CandidateService, ResumeParserService, CandidateStatusService],
  exports: [CandidateService, CandidateStatusService],
})
export class CandidatesModule {}
