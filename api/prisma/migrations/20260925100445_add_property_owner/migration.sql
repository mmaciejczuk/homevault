-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "ownerId" TEXT;

-- CreateIndex
CREATE INDEX "Property_ownerId_idx" ON "Property"("ownerId");
