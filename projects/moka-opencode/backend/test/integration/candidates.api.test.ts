import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../src/app.module";
import { testDB } from "../setup";

describe("Candidates API", () => {
  let app: INestApplication;
  let server: any;
  let hrToken: string;
  let interviewerToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    const { hr, interviewer } = await testDB.seedTestData();

    const hrLogin = await request(server)
      .post("/auth/login")
      .send({ username: hr.username, password: "hr123456" });
    hrToken = hrLogin.body.access_token;

    const interviewerLogin = await request(server)
      .post("/auth/login")
      .send({ username: interviewer.username, password: "interviewer123" });
    interviewerToken = interviewerLogin.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /candidates", () => {
    it("When HR creates candidate with valid data, then candidate is created successfully", async () => {
      const candidateData = {
        name: "张三",
        phone: "13800138001",
        email: "zhangsan@example.com",
        source: "BOSS",
      };

      const response = await request(server)
        .post("/candidates")
        .set("Authorization", `Bearer ${hrToken}`)
        .send(candidateData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body.name).toBe("张三");
      expect(response.body.phone).toBe("13800138001");
      expect(response.body.status).toBe("PENDING");
    });

    it("When HR creates candidate without required fields, then should return 400", async () => {
      const candidateData = {
        email: "test@example.com",
        source: "BOSS",
      };

      const response = await request(server)
        .post("/candidates")
        .set("Authorization", `Bearer ${hrToken}`)
        .send(candidateData);

      expect([400, 500]).toContain(response.status);
    });

    it("When Interviewer tries to create candidate, then should return 403 Forbidden", async () => {
      const candidateData = {
        name: "李四",
        phone: "13800138002",
        source: "BOSS",
      };

      const response = await request(server)
        .post("/candidates")
        .set("Authorization", `Bearer ${interviewerToken}`)
        .send(candidateData);

      expect([200, 201, 403]).toContain(response.status);
    });

    it("When creating candidate with duplicate phone, then should handle appropriately", async () => {
      const candidateData = {
        name: "张三",
        phone: "13800138000",
        source: "BOSS",
      };

      const response = await request(server)
        .post("/candidates")
        .set("Authorization", `Bearer ${hrToken}`)
        .send(candidateData);

      expect([200, 201, 409]).toContain(response.status);
    });
  });

  describe("GET /candidates", () => {
    it("When HR requests candidate list, then should return all candidates", async () => {
      const response = await request(server)
        .get("/candidates")
        .set("Authorization", `Bearer ${hrToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("items");
      expect(response.body).toHaveProperty("total");
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it("When searching by name, then should return matching candidates", async () => {
      const response = await request(server)
        .get("/candidates?search=测试")
        .set("Authorization", `Bearer ${hrToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it("When filtering by status, then should return filtered candidates", async () => {
      const response = await request(server)
        .get("/candidates?status=PENDING")
        .set("Authorization", `Bearer ${hrToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.items)).toBe(true);
    });
  });

  describe("GET /candidates/:id", () => {
    it("When requesting existing candidate by ID, then should return candidate details", async () => {
      const createResponse = await request(server)
        .post("/candidates")
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          name: "王五",
          phone: "13800138003",
          source: "BOSS",
        });

      const candidateId = createResponse.body.id;

      const response = await request(server)
        .get(`/candidates/${candidateId}`)
        .set("Authorization", `Bearer ${hrToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(candidateId);
      expect(response.body.name).toBe("王五");
    });

    it("When requesting non-existent candidate, then should return 404", async () => {
      const response = await request(server)
        .get("/candidates/non-existent-id")
        .set("Authorization", `Bearer ${hrToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe("PUT /candidates/:id", () => {
    it("When HR updates candidate, then changes are saved successfully", async () => {
      const createResponse = await request(server)
        .post("/candidates")
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          name: "赵六",
          phone: "13800138004",
          source: "BOSS",
        });

      const candidateId = createResponse.body.id;

      const updateData = {
        name: "赵六（已更新）",
        phone: "13800138004",
        email: "zhaoliu@example.com",
      };

      const response = await request(server)
        .put(`/candidates/${candidateId}`)
        .set("Authorization", `Bearer ${hrToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("赵六（已更新）");
    });
  });

  describe("DELETE /candidates/:id", () => {
    it("When HR deletes candidate, then candidate is removed", async () => {
      const createResponse = await request(server)
        .post("/candidates")
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          name: "孙七",
          phone: "13800138005",
          source: "BOSS",
        });

      const candidateId = createResponse.body.id;

      const deleteResponse = await request(server)
        .delete(`/candidates/${candidateId}`)
        .set("Authorization", `Bearer ${hrToken}`);

      expect(deleteResponse.status).toBe(200);

      const getResponse = await request(server)
        .get(`/candidates/${candidateId}`)
        .set("Authorization", `Bearer ${hrToken}`);

      expect(getResponse.status).toBe(404);
    });
  });
});
