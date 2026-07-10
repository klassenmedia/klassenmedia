-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "clientId" TEXT,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'image',
    "scheduledAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "reminderMode" BOOLEAN NOT NULL DEFAULT false,
    "reminderSentAt" DATETIME,
    "approval" TEXT NOT NULL DEFAULT 'none',
    "approvalNote" TEXT,
    "submittedAt" DATETIME,
    "decidedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Post_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Post_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Post" ("approval", "approvalNote", "body", "clientId", "createdAt", "decidedAt", "format", "id", "scheduledAt", "status", "submittedAt", "title", "updatedAt", "workspaceId") SELECT "approval", "approvalNote", "body", "clientId", "createdAt", "decidedAt", "format", "id", "scheduledAt", "status", "submittedAt", "title", "updatedAt", "workspaceId" FROM "Post";
DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
CREATE INDEX "Post_workspaceId_scheduledAt_idx" ON "Post"("workspaceId", "scheduledAt");
CREATE INDEX "Post_status_scheduledAt_idx" ON "Post"("status", "scheduledAt");
CREATE INDEX "Post_workspaceId_approval_idx" ON "Post"("workspaceId", "approval");
CREATE INDEX "Post_clientId_idx" ON "Post"("clientId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
