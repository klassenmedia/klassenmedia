-- AlterTable
ALTER TABLE "Client" ADD COLUMN "followUpAt" DATETIME;
ALTER TABLE "Client" ADD COLUMN "followUpNote" TEXT;

-- CreateTable
CREATE TABLE "ClientInteraction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "happenedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClientInteraction_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ClientInteraction_clientId_happenedAt_idx" ON "ClientInteraction"("clientId", "happenedAt");
