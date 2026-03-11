-- CreateEnum
CREATE TYPE "MentionStatus" AS ENUM ('PENDING', 'VIEWED', 'RESPONDED');

-- CreateTable
CREATE TABLE "resume_files" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_mentions" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "interviewerId" TEXT NOT NULL,
    "mentionedById" TEXT NOT NULL,
    "message" TEXT,
    "status" "MentionStatus" NOT NULL DEFAULT 'PENDING',
    "viewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidate_mentions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback_tokens" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "interviewerId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_status_history" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "oldStatus" "CandidateStatus",
    "newStatus" "CandidateStatus" NOT NULL,
    "reason" TEXT,
    "changedBy" TEXT,
    "relatedInterviewId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidate_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resume_files_candidateId_idx" ON "resume_files"("candidateId");

-- CreateIndex
CREATE INDEX "candidate_mentions_candidateId_idx" ON "candidate_mentions"("candidateId");

-- CreateIndex
CREATE INDEX "candidate_mentions_interviewerId_status_idx" ON "candidate_mentions"("interviewerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_tokens_interviewId_key" ON "feedback_tokens"("interviewId");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_tokens_token_key" ON "feedback_tokens"("token");

-- CreateIndex
CREATE INDEX "feedback_tokens_token_idx" ON "feedback_tokens"("token");

-- CreateIndex
CREATE INDEX "feedback_tokens_interviewId_idx" ON "feedback_tokens"("interviewId");

-- CreateIndex
CREATE INDEX "candidate_status_history_candidateId_idx" ON "candidate_status_history"("candidateId");

-- CreateIndex
CREATE INDEX "candidate_status_history_createdAt_idx" ON "candidate_status_history"("createdAt");

-- AddForeignKey
ALTER TABLE "resume_files" ADD CONSTRAINT "resume_files_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_files" ADD CONSTRAINT "resume_files_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_mentions" ADD CONSTRAINT "candidate_mentions_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_mentions" ADD CONSTRAINT "candidate_mentions_interviewerId_fkey" FOREIGN KEY ("interviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_mentions" ADD CONSTRAINT "candidate_mentions_mentionedById_fkey" FOREIGN KEY ("mentionedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_tokens" ADD CONSTRAINT "feedback_tokens_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "interviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_tokens" ADD CONSTRAINT "feedback_tokens_interviewerId_fkey" FOREIGN KEY ("interviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_status_history" ADD CONSTRAINT "candidate_status_history_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_status_history" ADD CONSTRAINT "candidate_status_history_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
