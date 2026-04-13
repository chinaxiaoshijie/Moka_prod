import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsEmail, IsOptional, IsIn, MinLength } from "class-validator";

export class CreateUserDto {
  @ApiProperty({ example: "john_doe", description: "用户名" })
  @IsString()
  username: string;

  @ApiProperty({ example: "password123", description: "密码" })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: "张三", description: "姓名" })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: "john@example.com", description: "邮箱" })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: "INTERVIEWER", enum: ["HR", "INTERVIEWER"], description: "角色" })
  @IsIn(["HR", "INTERVIEWER"])
  role: "HR" | "INTERVIEWER";
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: "新姓名", description: "姓名" })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: "email@example.com", description: "邮箱" })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: "newpassword123", description: "新密码" })
  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({ example: "HR", enum: ["HR", "INTERVIEWER"], description: "角色" })
  @IsIn(["HR", "INTERVIEWER"])
  @IsOptional()
  role?: "HR" | "INTERVIEWER";
}
