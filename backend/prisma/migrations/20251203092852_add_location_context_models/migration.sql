-- CreateTable
CREATE TABLE "LocationHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "dwellTime" INTEGER,
    "placeName" TEXT,
    "placeType" TEXT,
    "isSignificant" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LocationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivacyZone" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "radius" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "trackingDisabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrivacyZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationPrompt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "response" TEXT,
    "photos" TEXT[],
    "audioUrl" TEXT,
    "answered" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answeredAt" TIMESTAMP(3),

    CONSTRAINT "LocationPrompt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LocationHistory_userId_timestamp_idx" ON "LocationHistory"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "LocationHistory_userId_isSignificant_idx" ON "LocationHistory"("userId", "isSignificant");

-- CreateIndex
CREATE INDEX "PrivacyZone_userId_idx" ON "PrivacyZone"("userId");

-- CreateIndex
CREATE INDEX "LocationPrompt_userId_answered_idx" ON "LocationPrompt"("userId", "answered");

-- CreateIndex
CREATE INDEX "LocationPrompt_locationId_idx" ON "LocationPrompt"("locationId");

-- AddForeignKey
ALTER TABLE "LocationHistory" ADD CONSTRAINT "LocationHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivacyZone" ADD CONSTRAINT "PrivacyZone_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationPrompt" ADD CONSTRAINT "LocationPrompt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationPrompt" ADD CONSTRAINT "LocationPrompt_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "LocationHistory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
