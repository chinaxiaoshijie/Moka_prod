import { Module } from "@nestjs/common";
import { FeishuCalendarService } from "./feishu-calendar.service";

@Module({
  providers: [FeishuCalendarService],
  exports: [FeishuCalendarService],
})
export class FeishuCalendarModule {}
