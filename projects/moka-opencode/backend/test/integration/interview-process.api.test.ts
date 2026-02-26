import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../src/app.module";
import { testDB } from "../setup";

describe("Interview Process API", () => {
  let app: INestApplication;
  let server: any;
  let hrToken: string;
  let interviewerToken: string;
  let testCandidateId: string;
  let testPositionId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    const { hr, interviewer, position, candidate } =
      await testDB.seedTestData();

    const hrLogin = await request(server)
      .post("/auth/login")
      .send({ username: hr.username, password: "hr123456" });
    hrToken = hrLogin.body.access_token;

    const interviewerLogin = await request(server)
      .post("/auth/login")
      .send({ username: interviewer.username, password: "interviewer123" });
    interviewerToken = interviewerLogin.body.access_token;

    testCandidateId = candidate.id;
    testPositionId = position.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /interview-processes", () => {
    it("When HR creates interview process, then process is created with rounds", async () => {
      const usersResponse = await request(server)
        .get("/auth/users")
        .set("Authorization", `Bearer ${hrToken}`);

      const interviewerId = usersResponse.body.find(
        (u: any) => u.role === "INTERVIEWER",
      )?.id;
      const hrId = usersResponse.body.find((u: any) => u.role === "HR")?.id;

      const processData = {
        candidateId: testCandidateId,
        positionId: testPositionId,
        hasHRRound: true,
        totalRounds: 2,
        rounds: [
          {
            roundNumber: 1,
            interviewerId: hrId,
            isHRRound: true,
            roundType: "HR_SCREENING",
          },
          {
            roundNumber: 2,
            interviewerId: interviewerId,
            isHRRound: false,
            roundType: "TECHNICAL",
          },
        ],
      };

      const response = await request(server)
        .post("/interview-processes")
        .set("Authorization", `Bearer ${hrToken}`)
        .send(processData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body.totalRounds).toBe(2);
      expect(response.body.status).toBe("IN_PROGRESS");
      expect(response.body.rounds).toHaveLength(2);
    });

    it("When Interviewer tries to create process, then should return 403", async () => {
      const processData = {
        candidateId: testCandidateId,
        positionId: testPositionId,
        hasHRRound: true,
        totalRounds: 1,
        rounds: [],
      };

      const response = await request(server)
        .post("/interview-processes")
        .set("Authorization", `Bearer ${interviewerToken}`)
        .send(processData);

      expect(response.status).toBe(403);
    });
  });

  describe("GET /interview-processes", () => {
    it("When HR requests process list, then should return all processes", async () => {
      const response = await request(server)
        .get("/interview-processes")
        .set("Authorization", `Bearer ${hrToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("items");
      expect(response.body).toHaveProperty("total");
    });
  });

  describe("GET /interview-processes/:id", () => {
    it("When requesting specific process, then should return process details with rounds", async () => {
      const users = await request(server)
        .get("/auth/users")
        .set("Authorization", `Bearer ${hrToken}`);

      const interviewerId = users.body.find(
        (u: any) => u.role === "INTERVIEWER",
      )?.id;
      const hrId = users.body.find((u: any) => u.role === "HR")?.id;

      const createResponse = await request(server)
        .post("/interview-processes")
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          candidateId: testCandidateId,
          positionId: testPositionId,
          hasHRRound: true,
          totalRounds: 2,
          rounds: [
            {
              roundNumber: 1,
              interviewerId: hrId,
              isHRRound: true,
              roundType: "HR_SCREENING",
            },
            {
              roundNumber: 2,
              interviewerId: interviewerId,
              isHRRound: false,
              roundType: "TECHNICAL",
            },
          ],
        });

      const processId = createResponse.body.id;

      const response = await request(server)
        .get(`/interview-processes/${processId}`)
        .set("Authorization", `Bearer ${hrToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(processId);
      expect(response.body).toHaveProperty("rounds");
      expect(response.body.rounds).toHaveLength(2);
    });
  });

  describe("POST /interview-processes/:id/rounds/:roundNumber/interview", () => {
    it("When HR schedules interview for a round, then interview is created", async () => {
      const users = await request(server)
        .get("/auth/users")
        .set("Authorization", `Bearer ${hrToken}`);

      const interviewerId = users.body.find(
        (u: any) => u.role === "INTERVIEWER",
      )?.id;
      const hrId = users.body.find((u: any) => u.role === "HR")?.id;

      const processResponse = await request(server)
        .post("/interview-processes")
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          candidateId: testCandidateId,
          positionId: testPositionId,
          hasHRRound: true,
          totalRounds: 1,
          rounds: [
            {
              roundNumber: 1,
              interviewerId: hrId,
              isHRRound: true,
              roundType: "HR_SCREENING",
            },
          ],
        });

      const processId = processResponse.body.id;

      const interviewData = {
        startTime: "2026-03-01T10:00:00Z",
        endTime: "2026-03-01T11:00:00Z",
        format: "ONLINE",
        meetingUrl: "https://meeting.example.com/123",
        meetingNumber: "123456",
      };

      const response = await request(server)
        .post(`/interview-processes/${processId}/rounds/1/interview`)
        .set("Authorization", `Bearer ${hrToken}`)
        .send(interviewData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(
        response.body.format || response.body.interviewFormat,
      ).toBeTruthy();
    });
  });

  describe("POST /interview-processes/:id/complete-round", () => {
    it("When HR completes round with next action, then currentRound is incremented", async () => {
      const users = await request(server)
        .get("/auth/users")
        .set("Authorization", `Bearer ${hrToken}`);

      const interviewerId = users.body.find(
        (u: any) => u.role === "INTERVIEWER",
      )?.id;
      const hrId = users.body.find((u: any) => u.role === "HR")?.id;

      const processResponse = await request(server)
        .post("/interview-processes")
        .set("Authorization", `Bearer ${hrToken}`)
        .send({
          candidateId: testCandidateId,
          positionId: testPositionId,
          hasHRRound: true,
          totalRounds: 2,
          rounds: [
            {
              roundNumber: 1,
              interviewerId: hrId,
              isHRRound: true,
              roundType: "HR_SCREENING",
            },
            {
              roundNumber: 2,
              interviewerId: interviewerId,
              isHRRound: false,
              roundType: "TECHNICAL",
            },
          ],
        });

      const processId = processResponse.body.id;
      expect(processResponse.body.currentRound).toBe(1);

      const completeResponse = await request(server)
        .post(`/interview-processes/${processId}/complete-round`)
        .set("Authorization", `Bearer ${hrToken}`)
        .send({ action: "next" });

      expect([200, 201]).toContain(completeResponse.status);
      expect(completeResponse.body.currentRound).toBe(2);
    });
  });
});
