-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenarios" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "constraints" JSONB NOT NULL,
    "pricing" JSONB NOT NULL,
    "currentLoad" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipeline_runs" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "executionMs" INTEGER NOT NULL,
    "errorMessage" TEXT,
    "inputSnapshot" JSONB NOT NULL,
    "solarKw" DOUBLE PRECISION,
    "windKw" DOUBLE PRECISION,
    "batteryKwh" DOUBLE PRECISION,
    "totalCapex" DOUBLE PRECISION,
    "paybackMonths" DOUBLE PRECISION,
    "npv20yr" DOUBLE PRECISION,
    "roiPercent" DOUBLE PRECISION,
    "renewableFraction" DOUBLE PRECISION,
    "co2ReductionTonYear" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pipeline_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stage_results" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "stageName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "output" JSONB NOT NULL,

    CONSTRAINT "stage_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vppa_results" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "strikePriceMwh" DOUBLE PRECISION NOT NULL,
    "contractDuration" INTEGER NOT NULL,
    "forwardCurve" JSONB,
    "contractValue" DOUBLE PRECISION NOT NULL,
    "hedgeEffectiveness" DOUBLE PRECISION NOT NULL,
    "lcoeMwh" DOUBLE PRECISION NOT NULL,
    "annualCashFlows" JSONB NOT NULL,

    CONSTRAINT "vppa_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sensitivity_results" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "iterations" INTEGER NOT NULL,
    "confidence95" JSONB NOT NULL,
    "riskMetrics" JSONB NOT NULL,
    "tornadoChart" JSONB NOT NULL,

    CONSTRAINT "sensitivity_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "renewable_cache" (
    "id" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "hourlyData" JSONB NOT NULL,
    "dataQuality" JSONB NOT NULL,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "renewable_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "scenarios_userId_createdAt_idx" ON "scenarios"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "scenarios_latitude_longitude_idx" ON "scenarios"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "pipeline_runs_scenarioId_createdAt_idx" ON "pipeline_runs"("scenarioId", "createdAt");

-- CreateIndex
CREATE INDEX "pipeline_runs_success_createdAt_idx" ON "pipeline_runs"("success", "createdAt");

-- CreateIndex
CREATE INDEX "stage_results_runId_idx" ON "stage_results"("runId");

-- CreateIndex
CREATE UNIQUE INDEX "stage_results_runId_stageName_key" ON "stage_results"("runId", "stageName");

-- CreateIndex
CREATE UNIQUE INDEX "vppa_results_runId_key" ON "vppa_results"("runId");

-- CreateIndex
CREATE INDEX "vppa_results_runId_idx" ON "vppa_results"("runId");

-- CreateIndex
CREATE UNIQUE INDEX "sensitivity_results_runId_key" ON "sensitivity_results"("runId");

-- CreateIndex
CREATE INDEX "sensitivity_results_runId_idx" ON "sensitivity_results"("runId");

-- CreateIndex
CREATE INDEX "renewable_cache_expiresAt_idx" ON "renewable_cache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "renewable_cache_latitude_longitude_startDate_endDate_key" ON "renewable_cache"("latitude", "longitude", "startDate", "endDate");

-- AddForeignKey
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_runs" ADD CONSTRAINT "pipeline_runs_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_results" ADD CONSTRAINT "stage_results_runId_fkey" FOREIGN KEY ("runId") REFERENCES "pipeline_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vppa_results" ADD CONSTRAINT "vppa_results_runId_fkey" FOREIGN KEY ("runId") REFERENCES "pipeline_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sensitivity_results" ADD CONSTRAINT "sensitivity_results_runId_fkey" FOREIGN KEY ("runId") REFERENCES "pipeline_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
