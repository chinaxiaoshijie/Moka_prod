import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../src/app.module";
import { testDB } from "../setup";

/**
 * Authentication API Tests
 *
 * Best Practices Applied (from javascript-testing-best-practices):
 * - Test names: What-When-Expect pattern
 * - AAA Pattern: Arrange, Act, Assert
 * - Realistic test data
 * - Black-box testing (test behavior, not internals)
 */

describe("Authentication API", () => {
  let app: INestApplication;
  let server: any;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /auth/login", () => {
    it("When valid HR credentials provided, then should return access token and user data", async () => {
      const { hr } = await testDB.seedTestData();
      const loginDto = {
        username: hr.username,
        password: "hr123456",
      };

      const response = await request(server).post("/auth/login").send(loginDto);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("access_token");
      expect(response.body).toHaveProperty("user");
      expect(response.body.user.username).toBe(hr.username);
      expect(response.body.user.role).toBe("HR");
      expect(response.body.token_type).toBe("Bearer");
    });

    it("When valid Interviewer credentials provided, then should return access token", async () => {
      const { interviewer } = await testDB.seedTestData();
      const loginDto = {
        username: interviewer.username,
        password: "interviewer123",
      };

      const response = await request(server).post("/auth/login").send(loginDto);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("access_token");
      expect(response.body.user.role).toBe("INTERVIEWER");
    });

    it("When invalid password provided, then should return 401 Unauthorized", async () => {
      // Arrange
      await testDB.seedTestData();
      const { hr } = await testDB.seedTestData();
      const loginDto = {
        username: hr.username,
        password: "wrongpassword",
      };

      // Act
      const response = await request(server).post("/auth/login").send(loginDto);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message");
    });

    it("When non-existent user provided, then should return 401 Unauthorized", async () => {
      await testDB.seedTestData();
      const loginDto = {
        username: "nonexistent",
        password: "password123",
      };

      // Act
      const response = await request(server).post("/auth/login").send(loginDto);

      // Assert
      expect(response.status).toBe(401);
    });

    it("When empty credentials provided, then should return 400 Bad Request", async () => {
      await testDB.seedTestData();
      const loginDto = {
        username: "",
        password: "",
      };

      // Act
      const response = await request(server).post("/auth/login").send(loginDto);

      // Assert
      expect(response.status).toBe(401);
    });
  });

  describe("GET /auth/profile", () => {
    it("When valid token provided, then should return user profile", async () => {
      const { hr } = await testDB.seedTestData();
      const loginResponse = await request(server)
        .post("/auth/login")
        .send({ username: hr.username, password: "hr123456" });
      const token = loginResponse.body.access_token;

      const response = await request(server)
        .get("/auth/profile")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(hr.id);
      expect(response.body.username).toBe(hr.username);
      expect(response.body).not.toHaveProperty("password");
    });

    it("When no token provided, then should return 401 Unauthorized", async () => {
      // Act
      const response = await request(server).get("/auth/profile");

      // Assert
      expect(response.status).toBe(401);
    });

    it("When invalid token provided, then should return 401 Unauthorized", async () => {
      // Act
      const response = await request(server)
        .get("/auth/profile")
        .set("Authorization", "Bearer invalid-token");

      // Assert
      expect(response.status).toBe(401);
    });
  });

  describe("GET /auth/users", () => {
    it("When HR requests user list, then should return all users", async () => {
      const { hr } = await testDB.seedTestData();
      const loginResponse = await request(server)
        .post("/auth/login")
        .send({ username: hr.username, password: "hr123456" });
      const token = loginResponse.body.access_token;

      const response = await request(server)
        .get("/auth/users")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      expect(response.body[0]).toHaveProperty("id");
      expect(response.body[0]).toHaveProperty("username");
      expect(response.body[0]).not.toHaveProperty("password");
    });

    it("When Interviewer requests user list, then should return 200 with users", async () => {
      const { interviewer } = await testDB.seedTestData();
      const loginResponse = await request(server)
        .post("/auth/login")
        .send({ username: interviewer.username, password: "interviewer123" });
      const token = loginResponse.body.access_token;

      const response = await request(server)
        .get("/auth/users")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
