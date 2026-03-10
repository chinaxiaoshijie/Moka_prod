import { Injectable } from "@nestjs/common";

@Injectable()
export class AppConfigService {
  readonly databaseUrl: string;
  readonly jwtSecret: string;
  readonly jwtExpiresIn: string;
  readonly jwtRefreshExpiresIn: string;

  constructor() {
    this.databaseUrl = process.env.DATABASE_URL || "";
    this.jwtSecret = process.env.JWT_SECRET || "dev-secret-key";
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || "7d";
    this.jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "30d";
  }
}
