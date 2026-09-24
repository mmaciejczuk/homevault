-- CreateEnum
CREATE TYPE "EntryCategory" AS ENUM ('ELECTRICAL', 'PLUMBING', 'HEATING', 'WALL', 'FLOOR', 'DEVICE', 'NOTE', 'OTHER');

-- CreateTable
CREATE TABLE "Entry" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "EntryCategory" NOT NULL,
    "roomId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Entry_roomId_idx" ON "Entry"("roomId");

-- CreateIndex
CREATE INDEX "Entry_category_idx" ON "Entry"("category");

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
