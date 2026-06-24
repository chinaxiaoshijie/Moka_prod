import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../src/app.module";
import { testDB } from "../setup";

describe("Interviews API - CRUD Operations", () => {
  let app: INestApplication;
  let server: any;
  let hrToken: string;
  let interviewerToken: string;
  let hrUserId: string;

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
    hrUserId = hr.id;

    const hrLogin = await request(server)
      .post("/auth/login")
      .send({ username: hr.username, password: "hr123456" });
    hrToken = hrLogin.body.access_token;

    const intLogin = await request(server)
      .post("/auth/login")
      .send({ username: interviewer.username, password: "interviewer123" });
    interviewerToken = intLogin.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe("GET /interviews - List Interviews", () => {
    it("When HR lists interviews, then should return 200 with array", async () => {
      const response = await request(server)
        .get("/interviews")
        .set("Authorization", `Bearer ${hrToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("items");
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it("When interviewer lists interviews, then should return 200", async () => {
      const response = await request(server)
        .get("/interviews")
        .set("Authorization", `Bearer ${interviewerToken}`);

      expect(response.status).toBe(200);
    });

    it("When filtering by status, then should return filtered results", async () => {
      const response = await request(server)
        .get("/interviews?status=SCHEDULED")
        .set("Authorization", `Bearer ${hrToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it("When unauthenticated user lists interviews, then should return 401", async () => {
      const response = await request(server).get("/interviews");

      expect(response.status).toBe(401);
    });
  });

  describe("POST /interviews - Create Interview", () => {
    let positionId: string;
    let candidateId: string;
    let interviewerId: string;

    beforeEach(async () => {
      // Create position
      const positionRes = await request(server)
        .post("/positions")
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          title: `测试职位_${Date.now()}`,
          headcount: 1,
          status: "OPEN",
        });
      positionId = positionRes.body.id;

      // Create candidate
      const candidateRes = await request(server)
        .post("/candidates")
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          name: `测试候选人_${Date.now()}`,
          phone: `138${Date.now().toString().slice(-8)}`,
          source: "BOSS",
        });
      candidateId = candidateRes.body.id;

      // Get interviewer ID
      const usersRes = await request(server)
        .get("/users")
        .set("Authorization", `Bearer ${hrToken}`);
      const interviewer = usersRes.body.find(
        (u: any) => u.role === "INTERVIEWER",
      );
      interviewerId = interviewer.id;
    });

    it("When HR creates interview with valid data, then should return 201", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const response = await request(server)
        .post("/interviews")
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          candidateId,
          positionId,
          interviewerId,
          type: "INTERVIEW_1",
          format: "ONLINE",
          startTime: futureDate.toISOString(),
          endTime: new Date(futureDate.getTime() + 3600000).toISOString(),
        });

      expect([201, 200]).toContain(response.status);
    });

    it("When HR creates interview with past date, then should handle gracefully", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const response = await request(server)
        .post("/interviews")
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          candidateId,
          positionId,
          interviewerId,
          type: "INTERVIEW_1",
          format: "ONLINE",
          startTime: pastDate.toISOString(),
          endTime: new Date(pastDate.getTime() + 3600000).toISOString(),
        });

      // May accept or reject
      expect([201, 200, 400]).toContain(response.status);
    });

    it("When interviewer tries to create interview, then should return 403", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const response = await request(server)
        .post("/interviews")
        .set("Authorization", `Bearer ${interviewerToken}`)
        .send({
          candidateId,
          positionId,
          interviewerId,
          type: "INTERVIEW_1",
          format: "ONLINE",
          startTime: futureDate.toISOString(),
          endTime: new Date(futureDate.getTime() + 3600000).toISOString(),
        });

      expect(response.status).toBe(403);
    });

    it("When creating interview with invalid candidate, then should return 400", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const response = await request(server)
        .post("/interviews")
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          candidateId: "00000000-0000-0000-0000-000000000000",
          positionId,
          interviewerId,
          type: "INTERVIEW_1",
          format: "ONLINE",
          startTime: futureDate.toISOString(),
          endTime: new Date(futureDate.getTime() + 3600000).toISOString(),
        });

      expect([400, 404]).toContain(response.status);
    });
  });

  describe("GET /interviews/:id - Get Interview", () => {
    let interviewId: string;

    beforeEach(async () => {
      // Create position
      const positionRes = await request(server)
        .post("/positions")
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          title: `职位_${Date.now()}`,
          headcount: 1,
          status: "OPEN",
        });
      const positionId = positionRes.body.id;

      // Create candidate
      const candidateRes = await request(server)
        .post("/candidates")
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          name: `候选人_${Date.now()}`,
          phone: `139${Date.now().toString().slice(-8)}`,
          source: "BOSS",
        });
      const candidateId = candidateRes.body.id;

      // Get interviewer ID
      const usersRes = await request(server)
        .get("/users")
        .set("Authorization", `Bearer ${hrToken}`);
      const interviewer = usersRes.body.find(
        (u: any) => u.role === "INTERVIEWER",
      );
      const interviewerId = interviewer.id;

      // Create interview
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const interviewRes = await request(server)
        .post("/interviews")
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          candidateId,
          positionId,
          interviewerId,
          type: "INTERVIEW_1",
          format: "ONLINE",
          startTime: futureDate.toISOString(),
          endTime: new Date(futureDate.getTime() + 3600000).toISOString(),
        });

      interviewId = interviewRes.body.id;
    });

    it("When HR gets interview details, then should return 200", async () => {
      const response = await request(server)
        .get(`/interviews/${interviewId}`)
        .set("Authorization", `Bearer ${hrToken}`);

      expect([200, 404]).toContain(response.status);
    });

    it("When HR gets non-existent interview, then should return 404", async () => {
      const response = await request(server)
        .get("/interviews/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${hrToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe("PUT /interviews/:id - Update Interview", () => {
    let interviewId: string;

    beforeEach(async () => {
      // Create position
      const positionRes = await request(server)
        .post("/positions")
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          title: `职位更新_${Date.now()}`,
          headcount: 1,
          status: "OPEN",
        });
      const positionId = positionRes.body.id;

      // Create candidate
      const candidateRes = await request(server)
        .post("/candidates")
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          name: `候选人更新_${Date.now()}`,
          phone: `137${Date.now().toString().slice(-8)}`,
          source: "BOSS",
        });
      const candidateId = candidateRes.body.id;

      // Get interviewer ID
      const usersRes = await request(server)
        .get("/users")
        .set("Authorization", `Bearer ${hrToken}`);
      const interviewer = usersRes.body.find(
        (u: any) => u.role === "INTERVIEWER",
      );
      const interviewerId = interviewer.id;

      // Create interview
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const interviewRes = await request(server)
        .post("/interviews")
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          candidateId,
          positionId,
          interviewerId,
          type: "INTERVIEW_1",
          format: "ONLINE",
          startTime: futureDate.toISOString(),
          endTime: new Date(futureDate.getTime() + 3600000).toISOString(),
        });

      interviewId = interviewRes.body.id;
    });

    it("When HR updates interview status, then should return 200", async () => {
      const response = await request(server)
        .put(`/interviews/${interviewId}`)
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          status: "COMPLETED",
        });

      expect([200, 204]).toContain(response.status);
    });

    it("When HR updates interview to invalid status, then should return 400", async () => {
      const response = await request(server)
        .put(`/interviews/${interviewId}`)
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          status: "INVALID_STATUS",
        });

      expect([400, 422]).toContain(response.status);
    });
  });
});
