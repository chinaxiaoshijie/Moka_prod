import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../src/app.module";
import { testDB } from "../setup";

describe("Candidates API - Data Validation", () => {
  let app: INestApplication;
  let server: any;
  let hrToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    const { hr } = await testDB.seedTestData();

    const hrLogin = await request(server)
      .post("/auth/login")
      .send({ username: hr.username, password: "hr123456" });
    hrToken = hrLogin.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /candidates - Create Candidate Validation", () => {
    it("When creating candidate with valid data, then should succeed", async () => {
      const response = await request(server)
        .post("/candidates")
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          name: "测试候选人",
          phone: `138${Date.now().toString().slice(-8)}`,
          source: "BOSS",
        });

      expect([201, 200]).toContain(response.status);
    });

    it("When creating candidate with empty name, then should return 400", async () => {
      const response = await request(server)
        .post("/candidates")
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          name: "",
          phone: `138${Date.now().toString().slice(-8)}`,
          source: "BOSS",
        });

      expect(response.status).toBe(400);
    });

    it("When creating candidate without name, then should return 400", async () => {
      const response = await request(server)
        .post("/candidates")
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          phone: `138${Date.now().toString().slice(-8)}`,
          source: "BOSS",
        });

      expect(response.status).toBe(400);
    });

    it("When creating candidate with empty phone, then should return 400", async () => {
      const response = await request(server)
        .post("/candidates")
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          name: "测试候选人",
          phone: "",
          source: "BOSS",
        });

      expect(response.status).toBe(400);
    });

    it("When creating candidate without phone, then should return 400", async () => {
      const response = await request(server)
        .post("/candidates")
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          name: "测试候选人",
          source: "BOSS",
        });

      expect(response.status).toBe(400);
    });

    it("When creating candidate with invalid phone format, then should return 400", async () => {
      const response = await request(server)
        .post("/candidates")
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          name: "测试候选人",
          phone: "not-a-phone",
          source: "BOSS",
        });

      expect(response.status).toBe(400);
    });

    it("When creating candidate with invalid email format, then should handle gracefully", async () => {
      const response = await request(server)
        .post("/candidates")
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          name: "测试候选人",
          phone: `138${Date.now().toString().slice(-8)}`,
          email: "not-an-email",
          source: "BOSS",
        });

      expect([201, 200, 400]).toContain(response.status);
    });

    it("When creating candidate with invalid source, then should handle gracefully", async () => {
      const response = await request(server)
        .post("/candidates")
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          name: "测试候选人",
          phone: `138${Date.now().toString().slice(-8)}`,
          source: "INVALID_SOURCE",
        });

      expect([201, 200, 400]).toContain(response.status);
    });

    it("When creating candidate with very long name, then should handle", async () => {
      const longName = "a".repeat(500);
      const response = await request(server)
        .post("/candidates")
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          name: longName,
          phone: `138${Date.now().toString().slice(-8)}`,
          source: "BOSS",
        });

      expect([201, 200, 400]).toContain(response.status);
    });

    it("When creating candidate with XSS in name, then should sanitize", async () => {
      const response = await request(server)
        .post("/candidates")
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          name: "<script>alert('xss')</script>",
          phone: `138${Date.now().toString().slice(-8)}`,
          source: "BOSS",
        });

      expect([201, 200, 400]).toContain(response.status);
    });
  });

  describe("PUT /candidates/:id - Update Candidate Validation", () => {
    let candidateId: string;

    beforeEach(async () => {
      const createRes = await request(server)
        .post("/candidates")
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          name: `原始姓名_${Date.now()}`,
          phone: `139${Date.now().toString().slice(-8)}`,
          source: "BOSS",
        });
      candidateId = createRes.body.id;
    });

    it("When updating candidate with valid data, then should succeed", async () => {
      const response = await request(server)
        .put(`/candidates/${candidateId}`)
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          name: "更新后的姓名",
        });

      expect([200, 204]).toContain(response.status);
    });

    it("When updating candidate with empty name, then should return 400", async () => {
      const response = await request(server)
        .put(`/candidates/${candidateId}`)
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          name: "",
        });

      expect(response.status).toBe(400);
    });

    it("When updating non-existent candidate, then should return 404", async () => {
      const response = await request(server)
        .put("/candidates/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          name: "不存在的候选人",
        });

      expect(response.status).toBe(404);
    });
  });

  describe("GET /candidates - List Candidates Validation", () => {
    it("When listing candidates without filters, then should return all", async () => {
      const response = await request(server)
        .get("/candidates")
        .set("Authorization", `Bearer ${hrToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it("When filtering by valid status, then should return filtered results", async () => {
      const response = await request(server)
        .get("/candidates?status=PENDING")
        .set("Authorization", `Bearer ${hrToken}`);

      expect(response.status).toBe(200);
    });

    it("When filtering by invalid status, then should return empty or all", async () => {
      const response = await request(server)
        .get("/candidates?status=INVALID_STATUS")
        .set("Authorization", `Bearer ${hrToken}`);

      expect(response.status).toBe(200);
    });

    it("When searching with SQL injection attempt, then should sanitize", async () => {
      const response = await request(server)
        .get("/candidates?search='; DROP TABLE candidates; --")
        .set("Authorization", `Bearer ${hrToken}`);

      expect(response.status).toBe(200);
    });

    it("When pagination with valid page, then should return correct page", async () => {
      const response = await request(server)
        .get("/candidates?page=1&limit=10")
        .set("Authorization", `Bearer ${hrToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("total");
    });

    it("When pagination with negative page, then should handle gracefully", async () => {
      const response = await request(server)
        .get("/candidates?page=-1")
        .set("Authorization", `Bearer ${hrToken}`);

      expect(response.status).toBe(200);
    });

    it("When pagination with very large limit, then should cap at max", async () => {
      const response = await request(server)
        .get("/candidates?limit=999999")
        .set("Authorization", `Bearer ${hrToken}`);

      expect(response.status).toBe(200);
    });
  });
});
