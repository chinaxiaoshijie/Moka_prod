import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../src/app.module";
import { testDB } from "../setup";

/**
 * E2E Test: Complete Interview Workflow
 *
 * This test simulates a complete hiring workflow from start to finish:
 * 1. HR creates a candidate
 * 2. HR creates an interview process with multiple rounds
 * 3. HR schedules interviews for each round
 * 4. Interviewers submit feedback
 * 5. HR reviews and progresses the candidate through rounds
 * 6. Final hiring decision
 */

describe("E2E: Complete Interview Workflow", () => {
  let app: INestApplication;
  let server: any;
  let hrToken: string;
  let interviewerToken: string;
  let candidateId: string;
  let processId: string;
  let interviewId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    await testDB.cleanDatabase();
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

  it("Complete workflow: Create candidate → Process → Interview → Feedback → Hire", async () => {
    // ==========================================
    // STEP 1: HR creates a new candidate
    // ==========================================
    const candidateData = {
      name: "优秀候选人",
      phone: "13800138888",
      email: "talent@example.com",
      source: "BOSS",
    };

    const createCandidateResponse = await request(server)
      .post("/candidates")
      .set("Authorization", `Bearer ${hrToken}`)
      .send(candidateData);

    expect(createCandidateResponse.status).toBe(201);
    candidateId = createCandidateResponse.body.id;
    expect(createCandidateResponse.body.status).toBe("PENDING");

    // ==========================================
    // STEP 2: Get position and users for process setup
    // ==========================================
    const positionsResponse = await request(server)
      .get("/positions")
      .set("Authorization", `Bearer ${hrToken}`);

    expect(positionsResponse.status).toBe(200);
    const positionId = positionsResponse.body.items[0].id;

    const usersResponse = await request(server)
      .get("/auth/users")
      .set("Authorization", `Bearer ${hrToken}`);

    const hrId = usersResponse.body.find((u: any) => u.role === "HR")?.id;
    const interviewerId = usersResponse.body.find(
      (u: any) => u.role === "INTERVIEWER",
    )?.id;

    // ==========================================
    // STEP 3: HR creates interview process (3 rounds)
    // ==========================================
    const processData = {
      candidateId: candidateId,
      positionId: positionId,
      hasHRRound: true,
      totalRounds: 3,
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
        {
          roundNumber: 3,
          interviewerId: hrId,
          isHRRound: true,
          roundType: "FINAL",
        },
      ],
    };

    const createProcessResponse = await request(server)
      .post("/interview-processes")
      .set("Authorization", `Bearer ${hrToken}`)
      .send(processData);

    expect(createProcessResponse.status).toBe(201);
    processId = createProcessResponse.body.id;
    expect(createProcessResponse.body.totalRounds).toBe(3);
    expect(createProcessResponse.body.currentRound).toBe(1);
    expect(createProcessResponse.body.status).toBe("IN_PROGRESS");

    // ==========================================
    // STEP 4: HR schedules first round interview
    // ==========================================
    const interviewData = {
      startTime: "2026-03-15T10:00:00Z",
      endTime: "2026-03-15T11:00:00Z",
      format: "ONLINE",
      meetingUrl: "https://meeting.tencent.com/round1",
      meetingNumber: "111222333",
    };

    const scheduleInterviewResponse = await request(server)
      .post(`/interview-processes/${processId}/rounds/1/interview`)
      .set("Authorization", `Bearer ${hrToken}`)
      .send(interviewData);

    expect(scheduleInterviewResponse.status).toBe(201);
    interviewId = scheduleInterviewResponse.body.id;
    expect(scheduleInterviewResponse.body.format).toBe("ONLINE");

    // ==========================================
    // STEP 5: Interviewer (HR for round 1) submits feedback
    // ==========================================
    const feedbackData = {
      interviewId: interviewId,
      result: "PASS",
      strengths: "沟通能力强，工作经验丰富",
      weaknesses: "可以更深入技术细节",
      overallRating: 4,
      notes: "符合职位要求，建议进入下一轮",
    };

    const submitFeedbackResponse = await request(server)
      .post("/feedback")
      .set("Authorization", `Bearer ${hrToken}`)
      .send(feedbackData);

    expect(submitFeedbackResponse.status).toBe(201);
    expect(submitFeedbackResponse.body.result).toBe("PASS");

    // ==========================================
    // STEP 6: Verify feedback is saved
    // ==========================================
    const getFeedbackResponse = await request(server)
      .get(`/feedback/interview/${interviewId}`)
      .set("Authorization", `Bearer ${hrToken}`);

    expect(getFeedbackResponse.status).toBe(200);
    expect(getFeedbackResponse.body.feedbacks).toHaveLength(1);
    expect(getFeedbackResponse.body.feedbacks[0].result).toBe("PASS");
    expect(getFeedbackResponse.body.finalResult).toBe("通过");

    // ==========================================
    // STEP 7: HR progresses to next round
    // ==========================================
    const completeRoundResponse = await request(server)
      .post(`/interview-processes/${processId}/complete-round`)
      .set("Authorization", `Bearer ${hrToken}`)
      .send({ action: "next" });

    expect(completeRoundResponse.status).toBe(200);
    expect(completeRoundResponse.body.currentRound).toBe(2);
    expect(completeRoundResponse.body.status).toBe("IN_PROGRESS");

    // ==========================================
    // STEP 8: Verify candidate status is updated
    // ==========================================
    const getCandidateResponse = await request(server)
      .get(`/candidates/${candidateId}`)
      .set("Authorization", `Bearer ${hrToken}`);

    expect(getCandidateResponse.status).toBe(200);
    expect(getCandidateResponse.body.status).toBe("INTERVIEW_2");

    // ==========================================
    // STEP 9: Schedule second round interview
    // ==========================================
    const interview2Data = {
      startTime: "2026-03-18T14:00:00Z",
      endTime: "2026-03-18T15:30:00Z",
      format: "OFFLINE",
      location: "公司会议室A",
    };

    const scheduleInterview2Response = await request(server)
      .post(`/interview-processes/${processId}/rounds/2/interview`)
      .set("Authorization", `Bearer ${hrToken}`)
      .send(interview2Data);

    expect(scheduleInterview2Response.status).toBe(201);
    const interview2Id = scheduleInterview2Response.body.id;
    expect(scheduleInterview2Response.body.format).toBe("OFFLINE");

    // ==========================================
    // STEP 10: Interviewer submits feedback for round 2
    // ==========================================
    const feedback2Data = {
      interviewId: interview2Id,
      result: "PASS",
      strengths: "技术能力出色，解决问题能力强",
      weaknesses: "无",
      overallRating: 5,
      notes: "强烈推荐，技术非常匹配",
    };

    const submitFeedback2Response = await request(server)
      .post("/feedback")
      .set("Authorization", `Bearer ${interviewerToken}`)
      .send(feedback2Data);

    expect(submitFeedback2Response.status).toBe(201);

    // ==========================================
    // STEP 11: HR progresses to final round
    // ==========================================
    const completeRound2Response = await request(server)
      .post(`/interview-processes/${processId}/complete-round`)
      .set("Authorization", `Bearer ${hrToken}`)
      .send({ action: "next" });

    expect(completeRound2Response.status).toBe(200);
    expect(completeRound2Response.body.currentRound).toBe(3);

    // ==========================================
    // STEP 12: Schedule and complete final round
    // ==========================================
    const interview3Data = {
      startTime: "2026-03-22T10:00:00Z",
      endTime: "2026-03-22T11:00:00Z",
      format: "ONLINE",
      meetingUrl: "https://meeting.tencent.com/final",
    };

    const scheduleInterview3Response = await request(server)
      .post(`/interview-processes/${processId}/rounds/3/interview`)
      .set("Authorization", `Bearer ${hrToken}`)
      .send(interview3Data);

    expect(scheduleInterview3Response.status).toBe(201);
    const interview3Id = scheduleInterview3Response.body.id;

    // Submit final round feedback
    const feedback3Data = {
      interviewId: interview3Id,
      result: "PASS",
      strengths: "各方面都符合要求",
      weaknesses: "无",
      overallRating: 5,
      notes: "决定录用",
    };

    const submitFeedback3Response = await request(server)
      .post("/feedback")
      .set("Authorization", `Bearer ${hrToken}`)
      .send(feedback3Data);

    expect(submitFeedback3Response.status).toBe(201);

    // ==========================================
    // STEP 13: HR completes the process with hire decision
    // ==========================================
    const completeFinalResponse = await request(server)
      .post(`/interview-processes/${processId}/complete-round`)
      .set("Authorization", `Bearer ${hrToken}`)
      .send({ action: "complete" });

    expect(completeFinalResponse.status).toBe(200);
    expect(completeFinalResponse.body.status).toBe("COMPLETED");

    // ==========================================
    // STEP 14: Verify candidate is marked as hired
    // ==========================================
    const finalCandidateResponse = await request(server)
      .get(`/candidates/${candidateId}`)
      .set("Authorization", `Bearer ${hrToken}`);

    expect(finalCandidateResponse.status).toBe(200);
    expect(finalCandidateResponse.body.status).toBe("HIRED");

    console.log("✅ Complete workflow test passed!");
  });
});
