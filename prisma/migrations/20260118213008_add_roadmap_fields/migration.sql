/*
  Warnings:

  - Added the required column `priority` to the `Feature` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order` to the `Phase` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MoscowPriority" AS ENUM ('MUST', 'SHOULD', 'COULD', 'WONT');

-- AlterTable
ALTER TABLE "Feature" ADD COLUMN     "phaseId" TEXT,
ADD COLUMN     "priority" "MoscowPriority" NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'planned';

-- AlterTable
ALTER TABLE "Phase" ADD COLUMN     "order" INTEGER NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'planned';

-- CreateTable
CREATE TABLE "Milestone" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "phaseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Milestone_phaseId_idx" ON "Milestone"("phaseId");

-- CreateIndex
CREATE INDEX "Feature_phaseId_idx" ON "Feature"("phaseId");

-- AddForeignKey
ALTER TABLE "Feature" ADD CONSTRAINT "Feature_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
