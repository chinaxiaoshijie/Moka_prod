import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { NotificationService } from "./notification.service";
import { CreateNotificationDto } from "./dto/notification.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("notifications")
@Controller("notifications")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: "获取用户通知列表" })
  async findAll(@Request() req: any, @Query("unreadOnly") unreadOnly?: string) {
    return this.notificationService.findAll(
      req.user.sub,
      unreadOnly === "true",
    );
  }

  @Post()
  @ApiOperation({ summary: "创建通知" })
  async create(@Body() createDto: CreateNotificationDto) {
    return this.notificationService.create(createDto);
  }

  @Put(":id/read")
  @ApiOperation({ summary: "标记通知为已读" })
  async markAsRead(@Param("id") id: string, @Request() req: any) {
    return this.notificationService.markAsRead(id, req.user.sub);
  }

  @Put("read-all")
  @ApiOperation({ summary: "标记所有通知为已读" })
  async markAllAsRead(@Request() req: any) {
    return this.notificationService.markAllAsRead(req.user.sub);
  }

  @Delete(":id")
  @ApiOperation({ summary: "删除通知" })
  async delete(@Param("id") id: string, @Request() req: any) {
    await this.notificationService.delete(id, req.user.sub);
    return { message: "删除成功" };
  }
}
