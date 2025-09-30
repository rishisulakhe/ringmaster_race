-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Arena" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "description" TEXT,
    "unlockAfter" TEXT,

    CONSTRAINT "Arena_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoloRun" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "arenaId" TEXT NOT NULL,
    "timeMs" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SoloRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_username_key" ON "Player"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Arena_name_key" ON "Arena"("name");

-- CreateIndex
CREATE INDEX "SoloRun_arenaId_timeMs_idx" ON "SoloRun"("arenaId", "timeMs");

-- CreateIndex
CREATE INDEX "SoloRun_playerId_idx" ON "SoloRun"("playerId");

-- AddForeignKey
ALTER TABLE "SoloRun" ADD CONSTRAINT "SoloRun_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoloRun" ADD CONSTRAINT "SoloRun_arenaId_fkey" FOREIGN KEY ("arenaId") REFERENCES "Arena"("id") ON DELETE CASCADE ON UPDATE CASCADE;
