-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('INSTALLATION', 'INSPECTION', 'REPAIR', 'MAINTENANCE', 'OTHER');

-- CreateTable
CREATE TABLE "Device" (
    "id" SERIAL NOT NULL,
    "entryId" INTEGER NOT NULL,
    "manufacturer" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "installedAt" TIMESTAMP(3),
    "warrantyUntil" TIMESTAMP(3),
    "purchasePriceCents" INTEGER,
    "contractorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRecord" (
    "id" SERIAL NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "type" "ServiceType" NOT NULL,
    "serviceDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "contractorName" TEXT,
    "costCents" INTEGER,
    "nextServiceDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Device_entryId_key" ON "Device"("entryId");

-- CreateIndex
CREATE INDEX "Device_warrantyUntil_idx" ON "Device"("warrantyUntil");

-- CreateIndex
CREATE INDEX "Device_manufacturer_idx" ON "Device"("manufacturer");

-- CreateIndex
CREATE INDEX "Device_serialNumber_idx" ON "Device"("serialNumber");

-- CreateIndex
CREATE INDEX "ServiceRecord_deviceId_idx" ON "ServiceRecord"("deviceId");

-- CreateIndex
CREATE INDEX "ServiceRecord_serviceDate_idx" ON "ServiceRecord"("serviceDate");

-- CreateIndex
CREATE INDEX "ServiceRecord_nextServiceDate_idx" ON "ServiceRecord"("nextServiceDate");

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRecord" ADD CONSTRAINT "ServiceRecord_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;
