-- CreateTable
CREATE TABLE "tournament_settings" (
    "id" TEXT NOT NULL DEFAULT 'tournament_2026',
    "actualTopScorer" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournament_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "results" JSONB NOT NULL,
    "topScorer" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "simulations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "simulations_userId_key" ON "simulations"("userId");
