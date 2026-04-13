-- CreateTable
CREATE TABLE "InterviewEmailLog" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sentBy" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "errorMessage" TEXT,

    CONSTRAINT "InterviewEmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InterviewEmailLog_interviewId_idx" ON "InterviewEmailLog"("interviewId");

-- CreateIndex
CREATE INDEX "InterviewEmailLog_candidateId_idx" ON "InterviewEmailLog"("candidateId");

-- CreateIndex
CREATE INDEX "InterviewEmailLog_sentAt_idx" ON "InterviewEmailLog"("sentAt");

-- AddForeignKey
ALTER TABLE "InterviewEmailLog" ADD CONSTRAINT "InterviewEmailLog_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "interviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewEmailLog" ADD CONSTRAINT "InterviewEmailLog_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
