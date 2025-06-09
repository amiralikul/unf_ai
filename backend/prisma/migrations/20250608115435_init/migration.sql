-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "googleAccessToken" TEXT,
    "googleRefreshToken" TEXT,
    "trelloApiKey" TEXT,
    "trelloToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "googleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mimeType" TEXT,
    "size" BIGINT,
    "webViewLink" TEXT,
    "owners" JSONB NOT NULL,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Email" (
    "id" TEXT NOT NULL,
    "googleId" TEXT NOT NULL,
    "threadId" TEXT,
    "subject" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "body" TEXT,
    "snippet" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT true,
    "isImportant" BOOLEAN NOT NULL DEFAULT false,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Email_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrelloBoard" (
    "id" TEXT NOT NULL,
    "trelloId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "TrelloBoard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrelloCard" (
    "id" TEXT NOT NULL,
    "trelloId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "listName" TEXT,
    "listId" TEXT,
    "status" TEXT,
    "priority" TEXT,
    "position" DOUBLE PRECISION,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "boardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "TrelloCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "File_googleId_key" ON "File"("googleId");

-- CreateIndex
CREATE INDEX "File_userId_idx" ON "File"("userId");

-- CreateIndex
CREATE INDEX "File_modifiedAt_idx" ON "File"("modifiedAt");

-- CreateIndex
CREATE INDEX "File_mimeType_idx" ON "File"("mimeType");

-- CreateIndex
CREATE UNIQUE INDEX "Email_googleId_key" ON "Email"("googleId");

-- CreateIndex
CREATE INDEX "Email_userId_idx" ON "Email"("userId");

-- CreateIndex
CREATE INDEX "Email_receivedAt_idx" ON "Email"("receivedAt");

-- CreateIndex
CREATE INDEX "Email_sender_idx" ON "Email"("sender");

-- CreateIndex
CREATE INDEX "Email_isRead_userId_idx" ON "Email"("isRead", "userId");

-- CreateIndex
CREATE INDEX "Email_isImportant_userId_idx" ON "Email"("isImportant", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TrelloBoard_trelloId_key" ON "TrelloBoard"("trelloId");

-- CreateIndex
CREATE INDEX "TrelloBoard_userId_idx" ON "TrelloBoard"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TrelloCard_trelloId_key" ON "TrelloCard"("trelloId");

-- CreateIndex
CREATE INDEX "TrelloCard_boardId_idx" ON "TrelloCard"("boardId");

-- CreateIndex
CREATE INDEX "TrelloCard_userId_idx" ON "TrelloCard"("userId");

-- CreateIndex
CREATE INDEX "TrelloCard_status_idx" ON "TrelloCard"("status");

-- CreateIndex
CREATE INDEX "TrelloCard_priority_idx" ON "TrelloCard"("priority");

-- CreateIndex
CREATE INDEX "TrelloCard_dueDate_idx" ON "TrelloCard"("dueDate");

-- CreateIndex
CREATE INDEX "TrelloCard_status_userId_idx" ON "TrelloCard"("status", "userId");

-- CreateIndex
CREATE INDEX "TrelloCard_priority_userId_idx" ON "TrelloCard"("priority", "userId");

-- CreateIndex
CREATE INDEX "TrelloCard_dueDate_userId_idx" ON "TrelloCard"("dueDate", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionId_key" ON "Session"("sessionId");

-- CreateIndex
CREATE INDEX "Session_sessionId_idx" ON "Session"("sessionId");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrelloBoard" ADD CONSTRAINT "TrelloBoard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrelloCard" ADD CONSTRAINT "TrelloCard_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "TrelloBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrelloCard" ADD CONSTRAINT "TrelloCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
