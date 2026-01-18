-- AlterTable
ALTER TABLE "Terminal" ADD COLUMN     "pid" INTEGER,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'idle',
ADD COLUMN     "worktreeId" TEXT;

-- CreateIndex
CREATE INDEX "Terminal_worktreeId_idx" ON "Terminal"("worktreeId");

-- AddForeignKey
ALTER TABLE "Terminal" ADD CONSTRAINT "Terminal_worktreeId_fkey" FOREIGN KEY ("worktreeId") REFERENCES "Worktree"("id") ON DELETE SET NULL ON UPDATE CASCADE;
