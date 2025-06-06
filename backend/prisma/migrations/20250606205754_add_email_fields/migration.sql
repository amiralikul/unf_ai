-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Email" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "googleId" TEXT NOT NULL,
    "threadId" TEXT,
    "subject" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "body" TEXT,
    "snippet" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT true,
    "isImportant" BOOLEAN NOT NULL DEFAULT false,
    "receivedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Email_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Email" ("body", "createdAt", "googleId", "id", "receivedAt", "recipient", "sender", "subject", "threadId", "userId") SELECT "body", "createdAt", "googleId", "id", "receivedAt", "recipient", "sender", "subject", "threadId", "userId" FROM "Email";
DROP TABLE "Email";
ALTER TABLE "new_Email" RENAME TO "Email";
CREATE UNIQUE INDEX "Email_googleId_key" ON "Email"("googleId");
CREATE INDEX "Email_userId_idx" ON "Email"("userId");
CREATE INDEX "Email_receivedAt_idx" ON "Email"("receivedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
