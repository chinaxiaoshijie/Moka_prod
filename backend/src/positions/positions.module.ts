import { Module } from "@nestjs/common";
import { PositionService } from "./position.service";
import { PositionController } from "./position.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PositionController],
  providers: [PositionService],
  exports: [PositionService],
})
export class PositionsModule {}
