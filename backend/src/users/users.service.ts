import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcrypt";
import { CreateUserDto, UpdateUserDto } from "./dto/user.dto";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto, currentUserId: string) {
    // Check if current user is HR
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });

    if (!currentUser || currentUser.role !== "HR") {
      throw new ForbiddenException("只有HR才能创建用户");
    }

    // Check if username already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { username: createUserDto.username },
    });

    if (existingUser) {
      throw new BadRequestException("用户名已存在");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        username: createUserDto.username,
        password: hashedPassword,
        name: createUserDto.name,
        email: createUserDto.email,
        role: createUserDto.role,
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }

  async findAll(role?: string, includeInactive?: boolean) {
    const where: any = {};
    if (role) {
      where.role = role;
    }
    if (!includeInactive) {
      where.isActive = true;
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException("用户不存在");
    }

    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUserId: string,
  ) {
    // Check if current user is HR
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });

    if (!currentUser || currentUser.role !== "HR") {
      throw new ForbiddenException("只有HR才能更新用户");
    }

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException("用户不存在");
    }

    // Prevent HR from modifying themselves
    if (id === currentUserId) {
      throw new BadRequestException("不能修改自己的账户");
    }

    // Prepare update data
    const updateData: any = {};

    if (updateUserDto.name) {
      updateData.name = updateUserDto.name;
    }
    if (updateUserDto.email) {
      updateData.email = updateUserDto.email;
    }
    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    return user;
  }

  async remove(id: string, currentUserId: string) {
    // Check if current user is HR
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });

    if (!currentUser || currentUser.role !== "HR") {
      throw new ForbiddenException("只有HR才能停用用户");
    }

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException("用户不存在");
    }

    // Prevent HR from deactivating themselves
    if (id === currentUserId) {
      throw new BadRequestException("不能停用自己的账户");
    }

    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: "用户已停用" };
  }

  async activate(id: string, currentUserId: string) {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });

    if (!currentUser || currentUser.role !== "HR") {
      throw new ForbiddenException("只有HR才能启用用户");
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException("用户不存在");
    }

    await this.prisma.user.update({
      where: { id },
      data: { isActive: true },
    });

    return { message: "用户已启用" };
  }
}
