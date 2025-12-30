-- CreateTable
CREATE TABLE "PopulationAggregate" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "plays" INTEGER NOT NULL DEFAULT 0,
    "mean" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "p50" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "p25" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "p75" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "min" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "max" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PopulationAggregate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PopulationAggregate_gameId_date_key" ON "PopulationAggregate"("gameId", "date");

-- AddForeignKey
ALTER TABLE "PopulationAggregate" ADD CONSTRAINT "PopulationAggregate_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
