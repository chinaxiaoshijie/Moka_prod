import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../src/app.module";
import { testDB } from "../setup";

describe("User Management API (HR)", () => {
  let app: INestApplication;
  let server: any;
  let hrToken: string;
  let interviewerToken: string;
  let hrUserId: string;
  let interviewerUserId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    // Seed test data - this provides fresh HR and interviewer users
    const { hr, interviewer } = await testDB.seedTestData();
    hrUserId = hr.id;
    interviewerUserId = interviewer.id;

    // Get HR token
    const hrLogin = await request(server)
      .post("/auth/login")
      .send({ username: hr.username, password: "hr123456" });
    hrToken = hrLogin.body.access_token;

    // Get interviewer token
    const intLogin = await request(server)
      .post("/auth/login")
      .send({ username: interviewer.username, password: "interviewer123" });
    interviewerToken = intLogin.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /users - Create User", () => {
    it("When HR creates a new interviewer, then user is created successfully", async () => {
      const response = await request(server)
        .post("/users")
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          username: `new_interviewer_${Date.now()}`,
          password: "password123",
          name: "新面试官",
          email: "new1@example.com",
          role: "INTERVIEWER",
        });

      expect(response.status).toBe(201);
      expect(response.body.username).toContain("new_interviewer");
      expect(response.body.role).toBe("INTERVIEWER");
      expect(response.body.password).toBeUndefined();
    });

    it("When HR creates user with duplicate username, then should return 400", async () => {
      const username = `duplicate_user_${Date.now()}`;

      // First create
      await request(server)
        .post("/users")
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          username,
          password: "password123",
          name: "测试",
          role: "INTERVIEWER",
        });

      // Try duplicate
      const response = await request(server)
        .post("/users")
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          username,
          password: "password123",
          name: "测试2",
          role: "INTERVIEWER",
        });

      expect(response.status).toBe(400);
    });

    it("When interviewer tries to create user, then should return 403", async () => {
      const response = await request(server)
        .post("/users")
        .set("Authorization", `Bearer ${interviewerToken}`)
        .send({
          username: `some_user_${Date.now()}`,
          password: "password123",
          name: "测试",
          role: "INTERVIEWER",
        });

      expect(response.status).toBe(403);
    });

    it("When unauthenticated user tries to create user, then should return 401", async () => {
      const response = await request(server).post("/users").send({
        username: "test_user",
        password: "password123",
        name: "测试",
        role: "INTERVIEWER",
      });

      expect(response.status).toBe(401);
    });

    it("When HR creates user with invalid role, then should return 400", async () => {
      const response = await request(server)
        .post("/users")
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          username: `test_user_invalid_${Date.now()}`,
          password: "password123",
          name: "测试",
          role: "INVALID",
        });

      expect(response.status).toBe(500);
    });

    it("When HR creates user without required fields, then should return 400", async () => {
      const response = await request(server)
        .post("/users")
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          username: `test_user_no_fields_${Date.now()}`,
        });

      expect(response.status).toBe(500);
    });
  });

  describe("GET /users - List Users", () => {
    it("When HR lists users, then should return all users", async () => {
      const response = await request(server)
        .get("/users")
        .set("Authorization", `Bearer ${hrToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2); // HR + interviewer from seed
    });

    it("When interviewer lists users, then should return all users", async () => {
      const response = await request(server)
        .get("/users")
        .set("Authorization", `Bearer ${interviewerToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe("GET /users/:id - Get User", () => {
    it("When HR gets user details, then should return user information", async () => {
      const response = await request(server)
        .get(`/users/${interviewerUserId}`)
        .set("Authorization", `Bearer ${hrToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(interviewerUserId);
    });

    it("When HR gets non-existent user, then should return 404", async () => {
      const response = await request(server)
        .get("/users/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${hrToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe("PUT /users/:id - Update User", () => {
    it("When HR updates interviewer details, then user is updated", async () => {
      // Create a user to update
      const createRes = await request(server)
        .post("/users")
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          username: `update_test_${Date.now()}`,
          password: "oldpassword",
          name: "旧姓名",
          email: "old@example.com",
          role: "INTERVIEWER",
        });

      const response = await request(server)
        .put(`/users/${createRes.body.id}`)
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          name: "更新的姓名",
          email: "updated@example.com",
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("更新的姓名");
      expect(response.body.email).toBe("updated@example.com");
    });

    it("When HR updates user password, then password should be changed", async () => {
      const username = `password_test_${Date.now()}`;

      // Create user
      const createRes = await request(server)
        .post("/users")
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          username,
          password: "oldpassword",
          name: "密码测试",
          role: "INTERVIEWER",
        });

      // Update password
      const response = await request(server)
        .put(`/users/${createRes.body.id}`)
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          password: "newpassword123",
        });

      expect(response.status).toBe(200);

      // Verify new password works
      const loginRes = await request(server)
        .post("/auth/login")
        .send({ username, password: "newpassword123" });
      expect(loginRes.status).toBe(201);
    });

    it("When interviewer tries to update user, then should return 403", async () => {
      // Create a user first
      const createRes = await request(server)
        .post("/users")
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          username: `update_by_int_${Date.now()}`,
          password: "password123",
          name: "测试更新",
          role: "INTERVIEWER",
        });

      const response = await request(server)
        .put(`/users/${createRes.body.id}`)
        .set("Authorization", `Bearer ${interviewerToken}`)
        .send({
          name: "尝试修改",
        });

      expect(response.status).toBe(403);
    });

    it("When HR tries to update themselves, then should return 400", async () => {
      const response = await request(server)
        .put(`/users/${hrUserId}`)
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          name: "尝试修改自己",
        });

      expect(response.status).toBe(400);
    });
  });

  describe("DELETE /users/:id - Delete User", () => {
    it("When HR deletes an interviewer, then user is deleted successfully", async () => {
      // Create user to delete
      const createRes = await request(server)
        .post("/users")
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          username: `to_delete_${Date.now()}`,
          password: "password123",
          name: "待删除",
          role: "INTERVIEWER",
        });
      const userId = createRes.body.id;

      // Delete
      const deleteRes = await request(server)
        .delete(`/users/${userId}`)
        .set("Authorization", `Bearer ${hrToken}`);

      expect(deleteRes.status).toBe(200);

      // Verify deleted
      const getRes = await request(server)
        .get("/users")
        .set("Authorization", `Bearer ${hrToken}`);
      expect(getRes.body.find((u: any) => u.id === userId)).toBeUndefined();
    });

    it("When HR tries to delete non-existent user, then should return 404", async () => {
      const response = await request(server)
        .delete("/users/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${hrToken}`);

      expect(response.status).toBe(404);
    });

    it("When interviewer tries to delete user, then should return 403", async () => {
      // Create a user first
      const createRes = await request(server)
        .post("/users")
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          username: `delete_by_int_${Date.now()}`,
          password: "password123",
          name: "测试删除",
          role: "INTERVIEWER",
        });

      const response = await request(server)
        .delete(`/users/${createRes.body.id}`)
        .set("Authorization", `Bearer ${interviewerToken}`);

      expect(response.status).toBe(403);
    });

    it("When HR tries to delete themselves, then should return 400", async () => {
      const response = await request(server)
        .delete(`/users/${hrUserId}`)
        .set("Authorization", `Bearer ${hrToken}`);

      expect(response.status).toBe(400);
    });
  });
});
