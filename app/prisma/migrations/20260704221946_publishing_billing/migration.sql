-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN "currentPeriodEnd" DATETIME;
ALTER TABLE "Workspace" ADD COLUMN "lastGrantAt" DATETIME;
ALTER TABLE "Workspace" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "Workspace" ADD COLUMN "stripeSubscriptionId" TEXT;
ALTER TABLE "Workspace" ADD COLUMN "subscriptionStatus" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PostAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "publishedPostId" TEXT,
    "publishedAt" DATETIME,
    "error" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PostAccount_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PostAccount_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SocialAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PostAccount" ("accountId", "id", "postId") SELECT "accountId", "id", "postId" FROM "PostAccount";
DROP TABLE "PostAccount";
ALTER TABLE "new_PostAccount" RENAME TO "PostAccount";
CREATE UNIQUE INDEX "PostAccount_postId_accountId_key" ON "PostAccount"("postId", "accountId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_stripeCustomerId_key" ON "Workspace"("stripeCustomerId");

