import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

/**
 * Test Database Setup
 *
 * Following best practices from javascript-testing-best-practices:
 * - Use separate test database
 * - Clean up before each test
 * - Seed with realistic test data
 */

export const testDB = {
  prisma,

  async cleanDatabase() {
    await prisma.interviewFeedback.deleteMany().catch(() => {});
    await prisma.interview.deleteMany().catch(() => {});
    await prisma.interviewRound.deleteMany().catch(() => {});
    await prisma.interviewProcess.deleteMany().catch(() => {});
    await prisma.candidate.deleteMany().catch(() => {});
    await prisma.position.deleteMany().catch(() => {});
    await prisma.user.deleteMany().catch(() => {});
  },

  async seedTestData() {
    const timestamp = Date.now();
    const suffix = timestamp.toString().slice(-6);

    const hrPassword = await bcrypt.hash("hr123456", 10);
    const hr = await prisma.user.create({
      data: {
        username: `hr_${suffix}`,
        password: hrPassword,
        name: "张HR",
        email: `hr_${suffix}@company.com`,
        role: "HR",
      },
    });

    const interviewerPassword = await bcrypt.hash("interviewer123", 10);
    const interviewer = await prisma.user.create({
      data: {
        username: `interviewer_${suffix}`,
        password: interviewerPassword,
        name: "李面试官",
        email: `interviewer_${suffix}@company.com`,
        role: "INTERVIEWER",
      },
    });

    const position = await prisma.position.create({
      data: {
        title: "前端开发工程师",
        description: "负责前端开发工作",
        salaryMin: 15000,
        salaryMax: 25000,
        headcount: 2,
        location: "北京",
        status: "OPEN",
      },
    });

    const candidate = await prisma.candidate.create({
      data: {
        name: "测试候选人",
        phone: `13800${suffix}`,
        email: `candidate_${suffix}@test.com`,
        status: "PENDING",
        source: "BOSS",
      },
    });

    return { hr, interviewer, position, candidate, suffix };
  },

  async disconnect() {
    await prisma.$disconnect();
  },
};

// Global test setup
beforeAll(async () => {
  // Ensure clean state before all tests
  await testDB.cleanDatabase();
});

beforeEach(async () => {
  // Clean before each test to ensure isolation
  await testDB.cleanDatabase();
});

afterAll(async () => {
  await testDB.cleanDatabase();
  await testDB.disconnect();
});
