-- CreateEnum
CREATE TYPE "ProcessStatus" AS ENUM ('IN_PROGRESS', 'WAITING_HR', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "interviews" ADD COLUMN     "isHRRound" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "processId" TEXT,
ADD COLUMN     "roundNumber" INTEGER;

-- CreateTable
CREATE TABLE "interview_processes" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "currentRound" INTEGER NOT NULL DEFAULT 1,
    "totalRounds" INTEGER NOT NULL DEFAULT 3,
    "status" "ProcessStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "hasHRRound" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "interview_processes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_rounds" (
    "id" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "interviewerId" TEXT NOT NULL,
    "isHRRound" BOOLEAN NOT NULL DEFAULT false,
    "roundType" TEXT NOT NULL,

    CONSTRAINT "interview_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "interview_rounds_processId_roundNumber_key" ON "interview_rounds"("processId", "roundNumber");

-- AddForeignKey
ALTER TABLE "interview_processes" ADD CONSTRAINT "interview_processes_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_processes" ADD CONSTRAINT "interview_processes_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_processes" ADD CONSTRAINT "interview_processes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_rounds" ADD CONSTRAINT "interview_rounds_processId_fkey" FOREIGN KEY ("processId") REFERENCES "interview_processes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_rounds" ADD CONSTRAINT "interview_rounds_interviewerId_fkey" FOREIGN KEY ("interviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_processId_fkey" FOREIGN KEY ("processId") REFERENCES "interview_processes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
