import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Creating test users...");

  const hrPassword = await bcrypt.hash("hr123456", 10);
  const hrUser = await prisma.user.upsert({
    where: { username: "hr" },
    update: {},
    create: {
      username: "hr",
      password: hrPassword,
      name: "张HR",
      email: "hr@company.com",
      role: "HR",
    },
  });
  console.log("HR user created:", hrUser.username);

  const interviewerPassword = await bcrypt.hash("interviewer123", 10);
  const interviewerUser = await prisma.user.upsert({
    where: { username: "interviewer" },
    update: {},
    create: {
      username: "interviewer",
      password: interviewerPassword,
      name: "李面试官",
      email: "interviewer@company.com",
      role: "INTERVIEWER",
    },
  });
  console.log("Interviewer user created:", interviewerUser.username);

  console.log("\nTest users created successfully!");
  console.log("\nCredentials:");
  console.log("HR: username='hr', password='hr123456'");
  console.log("Interviewer: username='interviewer', password='interviewer123'");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
