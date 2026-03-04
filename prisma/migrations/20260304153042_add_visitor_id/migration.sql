-- AlterTable
ALTER TABLE "PageVisit" ADD COLUMN "visitorId" TEXT;

-- CreateIndex
CREATE INDEX "PageVisit_visitorId_path_visitedAt_idx" ON "PageVisit"("visitorId", "path", "visitedAt");
