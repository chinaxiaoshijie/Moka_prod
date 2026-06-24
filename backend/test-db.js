const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function test() {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");
    const users = await prisma.user.findMany();
    console.log("Users count:", users.length);
    await prisma.$disconnect();
  } catch (error) {
    console.error("Database connection error:", error);
  }
}

test();
