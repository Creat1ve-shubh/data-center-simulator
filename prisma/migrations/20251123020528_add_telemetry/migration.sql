-- CreateTable
CREATE TABLE "telemetry_data" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "facilityEnergyKWh" DOUBLE PRECISION NOT NULL,
    "itLoadKW" DOUBLE PRECISION,
    "coolingLoadKW" DOUBLE PRECISION,
    "pue" DOUBLE PRECISION,
    "solarGenKW" DOUBLE PRECISION,
    "windGenKW" DOUBLE PRECISION,
    "batterySOC" DOUBLE PRECISION,
    "gridImportKW" DOUBLE PRECISION,
    "outdoorTempC" DOUBLE PRECISION,
    "carbonIntensity" DOUBLE PRECISION,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telemetry_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "telemetry_data_scenarioId_timestamp_idx" ON "telemetry_data"("scenarioId", "timestamp");

-- CreateIndex
CREATE INDEX "telemetry_data_timestamp_idx" ON "telemetry_data"("timestamp");

-- AddForeignKey
ALTER TABLE "telemetry_data" ADD CONSTRAINT "telemetry_data_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
