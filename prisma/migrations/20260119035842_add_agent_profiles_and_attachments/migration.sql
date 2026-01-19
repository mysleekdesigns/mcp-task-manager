-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "agentProfile" TEXT,
ADD COLUMN     "phaseConfig" JSONB;

-- CreateTable
CREATE TABLE "TaskAttachment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mimeType" TEXT,
    "size" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskAttachment_taskId_idx" ON "TaskAttachment"("taskId");

-- AddForeignKey
ALTER TABLE "TaskAttachment" ADD CONSTRAINT "TaskAttachment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
