import { Injectable } from "@nestjs/common";

@Injectable()
export class AppConfigService {
  readonly databaseUrl: string;
  readonly jwtSecret: string;
  readonly jwtExpiresIn: string;
  readonly jwtRefreshExpiresIn: string;

  constructor() {
    this.databaseUrl = process.env.DATABASE_URL || "";
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret === "dev-secret-key") {
      throw new Error(
        "JWT_SECRET environment variable must be set to a secure random value (min 32 characters). " +
        "For development, you can use: openssl rand -hex 32"
      );
    }
    this.jwtSecret = jwtSecret;
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || "7d";
    this.jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "30d";
  }
}
