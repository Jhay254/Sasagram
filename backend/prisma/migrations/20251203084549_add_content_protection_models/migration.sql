-- CreateTable
CREATE TABLE "UserActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "metadata" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "scheduled" BOOLEAN NOT NULL DEFAULT false,
    "clickedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Watermark" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "watermarkData" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Watermark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScreenshotDetection" (
    "id" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "warningIssued" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ScreenshotDetection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentHash" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "blockchain" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ContentHash_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserActivity_userId_idx" ON "UserActivity"("userId");

-- CreateIndex
CREATE INDEX "UserActivity_activityType_idx" ON "UserActivity"("activityType");

-- CreateIndex
CREATE INDEX "UserActivity_timestamp_idx" ON "UserActivity"("timestamp");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "Notification"("read");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Watermark_contentId_idx" ON "Watermark"("contentId");

-- CreateIndex
CREATE INDEX "Watermark_subscriberId_idx" ON "Watermark"("subscriberId");

-- CreateIndex
CREATE INDEX "ScreenshotDetection_subscriberId_idx" ON "ScreenshotDetection"("subscriberId");

-- CreateIndex
CREATE INDEX "ScreenshotDetection_creatorId_idx" ON "ScreenshotDetection"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentHash_contentId_key" ON "ContentHash"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentHash_hash_key" ON "ContentHash"("hash");

-- CreateIndex
CREATE INDEX "ContentHash_hash_idx" ON "ContentHash"("hash");

-- AddForeignKey
ALTER TABLE "Watermark" ADD CONSTRAINT "Watermark_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScreenshotDetection" ADD CONSTRAINT "ScreenshotDetection_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScreenshotDetection" ADD CONSTRAINT "ScreenshotDetection_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
