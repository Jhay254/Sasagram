/*
  Warnings:

  - The `mediaUrls` column on the `LivingFeedEntry` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `updatedAt` to the `LivingFeedEntry` table without a default value. This is not possible if the table is not empty.
  - Made the column `chapterId` on table `LivingFeedEntry` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "LivingChapter" DROP CONSTRAINT "LivingChapter_userId_fkey";

-- DropForeignKey
ALTER TABLE "LivingFeedEntry" DROP CONSTRAINT "LivingFeedEntry_chapterId_fkey";

-- DropForeignKey
ALTER TABLE "LivingFeedEntry" DROP CONSTRAINT "LivingFeedEntry_userId_fkey";

-- DropIndex
DROP INDEX "LivingChapter_userId_status_idx";

-- AlterTable
ALTER TABLE "LivingChapter" ADD COLUMN     "releaseSchedule" JSONB,
ALTER COLUMN "status" DROP DEFAULT;

-- AlterTable
ALTER TABLE "LivingFeedEntry" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "mediaUrls",
ADD COLUMN     "mediaUrls" TEXT[],
ALTER COLUMN "chapterId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "LivingChapter_userId_idx" ON "LivingChapter"("userId");

-- CreateIndex
CREATE INDEX "LivingChapter_status_idx" ON "LivingChapter"("status");

-- CreateIndex
CREATE INDEX "LivingFeedEntry_chapterId_idx" ON "LivingFeedEntry"("chapterId");

-- AddForeignKey
ALTER TABLE "LivingChapter" ADD CONSTRAINT "LivingChapter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LivingFeedEntry" ADD CONSTRAINT "LivingFeedEntry_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "LivingChapter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LivingFeedEntry" ADD CONSTRAINT "LivingFeedEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
