import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreatePositionDto,
  UpdatePositionDto,
  PositionResponseDto,
  PositionListResponseDto,
} from "./dto/position.dto";

@Injectable()
export class PositionService {
  constructor(private prisma: PrismaService) {}

  async create(
    createPositionDto: CreatePositionDto,
  ): Promise<PositionResponseDto> {
    const position = await this.prisma.position.create({
      data: {
        title: createPositionDto.title,
        description: createPositionDto.description,
        salaryMin: createPositionDto.salaryMin,
        salaryMax: createPositionDto.salaryMax,
        headcount: createPositionDto.headcount || 1,
        location: createPositionDto.location,
        status: "OPEN",
      },
    });

    return this.mapToResponseDto(position);
  }

  async findAll(
    page: number = 1,
    pageSize: number = 10,
  ): Promise<PositionListResponseDto> {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.prisma.position.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.position.count(),
    ]);

    return {
      items: items.map((item: any) => this.mapToResponseDto(item)),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string): Promise<PositionResponseDto> {
    const position = await this.prisma.position.findUnique({
      where: { id },
    });

    if (!position) {
      throw new Error("职位不存在");
    }

    return this.mapToResponseDto(position);
  }

  async update(
    id: string,
    updatePositionDto: UpdatePositionDto,
  ): Promise<PositionResponseDto> {
    const position = await this.prisma.position.findUnique({
      where: { id },
    });

    if (!position) {
      throw new Error("职位不存在");
    }

    const updatedPosition = await this.prisma.position.update({
      where: { id },
      data: updatePositionDto,
    });

    return this.mapToResponseDto(updatedPosition);
  }

  async remove(id: string): Promise<PositionResponseDto> {
    const position = await this.prisma.position.findUnique({
      where: { id },
    });

    if (!position) {
      throw new Error("职位不存在");
    }

    await this.prisma.position.delete({
      where: { id },
    });

    return this.mapToResponseDto(position);
  }

  private mapToResponseDto(position: any): PositionResponseDto {
    return {
      id: position.id,
      title: position.title,
      description: position.description,
      salaryMin: position.salaryMin,
      salaryMax: position.salaryMax,
      headcount: position.headcount,
      hiredCount: position.hiredCount,
      inProgressCount: position.inProgressCount,
      status: position.status,
      location: position.location,
      requirements: position.requirements,
      createdAt: position.createdAt,
      updatedAt: position.updatedAt,
    };
  }
}
