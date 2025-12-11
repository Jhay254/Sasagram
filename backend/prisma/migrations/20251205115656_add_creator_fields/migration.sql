/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "archetype" TEXT,
ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "avgRating" DOUBLE PRECISION,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "categories" TEXT[],
ADD COLUMN     "coverImage" TEXT,
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "profileVideo" TEXT,
ADD COLUMN     "reviewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "subscriberCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalChapters" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "trendingScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "urgencyOffer" JSONB,
ADD COLUMN     "username" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
