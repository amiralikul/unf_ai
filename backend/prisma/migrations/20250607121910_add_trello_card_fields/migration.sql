-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TrelloCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trelloId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "listName" TEXT,
    "listId" TEXT,
    "status" TEXT,
    "priority" TEXT,
    "position" REAL,
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "boardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "TrelloCard_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "TrelloBoard" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrelloCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TrelloCard" ("boardId", "createdAt", "description", "dueDate", "id", "listName", "name", "trelloId", "url", "userId") SELECT "boardId", "createdAt", "description", "dueDate", "id", "listName", "name", "trelloId", "url", "userId" FROM "TrelloCard";
DROP TABLE "TrelloCard";
ALTER TABLE "new_TrelloCard" RENAME TO "TrelloCard";
CREATE UNIQUE INDEX "TrelloCard_trelloId_key" ON "TrelloCard"("trelloId");
CREATE INDEX "TrelloCard_boardId_idx" ON "TrelloCard"("boardId");
CREATE INDEX "TrelloCard_userId_idx" ON "TrelloCard"("userId");
CREATE INDEX "TrelloCard_status_idx" ON "TrelloCard"("status");
CREATE INDEX "TrelloCard_priority_idx" ON "TrelloCard"("priority");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
