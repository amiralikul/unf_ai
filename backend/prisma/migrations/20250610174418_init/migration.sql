-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "google_access_token" TEXT,
    "google_refresh_token" TEXT,
    "trello_api_key" TEXT,
    "trello_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "google_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mime_type" TEXT,
    "size" BIGINT,
    "web_view_link" TEXT,
    "owners" JSONB NOT NULL,
    "modified_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,
    "file_type" TEXT DEFAULT 'drive',
    "docs_url" TEXT,
    "is_shared" BOOLEAN DEFAULT false,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Email" (
    "id" TEXT NOT NULL,
    "google_id" TEXT NOT NULL,
    "thread_id" TEXT,
    "subject" TEXT NOT NULL,
    "sender" TEXT,
    "sender_name" TEXT,
    "sender_email" TEXT,
    "recipient" TEXT,
    "recipient_name" TEXT,
    "recipient_email" TEXT,
    "body" TEXT,
    "snippet" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT true,
    "is_important" BOOLEAN NOT NULL DEFAULT false,
    "received_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "Email_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailFileLink" (
    "email_id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,

    CONSTRAINT "EmailFileLink_pkey" PRIMARY KEY ("email_id","file_id")
);

-- CreateTable
CREATE TABLE "TrelloBoard" (
    "id" TEXT NOT NULL,
    "trello_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "TrelloBoard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrelloCard" (
    "id" TEXT NOT NULL,
    "trello_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "list_name" TEXT,
    "list_id" TEXT,
    "status" TEXT,
    "priority" TEXT,
    "position" DOUBLE PRECISION,
    "due_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "board_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "TrelloCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_accessed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrelloCardFileLink" (
    "id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "link_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "TrelloCardFileLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrelloCardEmailLink" (
    "id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "email_id" TEXT NOT NULL,
    "link_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "TrelloCardEmailLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "File_google_id_key" ON "File"("google_id");

-- CreateIndex
CREATE INDEX "File_user_id_idx" ON "File"("user_id");

-- CreateIndex
CREATE INDEX "File_modified_at_idx" ON "File"("modified_at");

-- CreateIndex
CREATE INDEX "File_mime_type_idx" ON "File"("mime_type");

-- CreateIndex
CREATE INDEX "File_file_type_idx" ON "File"("file_type");

-- CreateIndex
CREATE INDEX "File_file_type_user_id_idx" ON "File"("file_type", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Email_google_id_key" ON "Email"("google_id");

-- CreateIndex
CREATE INDEX "Email_user_id_idx" ON "Email"("user_id");

-- CreateIndex
CREATE INDEX "Email_received_at_idx" ON "Email"("received_at");

-- CreateIndex
CREATE INDEX "Email_sender_idx" ON "Email"("sender");

-- CreateIndex
CREATE INDEX "Email_sender_email_idx" ON "Email"("sender_email");

-- CreateIndex
CREATE INDEX "Email_recipient_email_idx" ON "Email"("recipient_email");

-- CreateIndex
CREATE INDEX "Email_is_read_user_id_idx" ON "Email"("is_read", "user_id");

-- CreateIndex
CREATE INDEX "Email_is_important_user_id_idx" ON "Email"("is_important", "user_id");

-- CreateIndex
CREATE INDEX "EmailFileLink_file_id_idx" ON "EmailFileLink"("file_id");

-- CreateIndex
CREATE UNIQUE INDEX "TrelloBoard_trello_id_key" ON "TrelloBoard"("trello_id");

-- CreateIndex
CREATE INDEX "TrelloBoard_user_id_idx" ON "TrelloBoard"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "TrelloCard_trello_id_key" ON "TrelloCard"("trello_id");

-- CreateIndex
CREATE INDEX "TrelloCard_board_id_idx" ON "TrelloCard"("board_id");

-- CreateIndex
CREATE INDEX "TrelloCard_user_id_idx" ON "TrelloCard"("user_id");

-- CreateIndex
CREATE INDEX "TrelloCard_status_idx" ON "TrelloCard"("status");

-- CreateIndex
CREATE INDEX "TrelloCard_priority_idx" ON "TrelloCard"("priority");

-- CreateIndex
CREATE INDEX "TrelloCard_due_date_idx" ON "TrelloCard"("due_date");

-- CreateIndex
CREATE INDEX "TrelloCard_status_user_id_idx" ON "TrelloCard"("status", "user_id");

-- CreateIndex
CREATE INDEX "TrelloCard_priority_user_id_idx" ON "TrelloCard"("priority", "user_id");

-- CreateIndex
CREATE INDEX "TrelloCard_due_date_user_id_idx" ON "TrelloCard"("due_date", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Session_session_id_key" ON "Session"("session_id");

-- CreateIndex
CREATE INDEX "Session_session_id_idx" ON "Session"("session_id");

-- CreateIndex
CREATE INDEX "Session_user_id_idx" ON "Session"("user_id");

-- CreateIndex
CREATE INDEX "Session_expires_at_idx" ON "Session"("expires_at");

-- CreateIndex
CREATE INDEX "TrelloCardFileLink_card_id_idx" ON "TrelloCardFileLink"("card_id");

-- CreateIndex
CREATE INDEX "TrelloCardFileLink_file_id_idx" ON "TrelloCardFileLink"("file_id");

-- CreateIndex
CREATE INDEX "TrelloCardFileLink_link_type_idx" ON "TrelloCardFileLink"("link_type");

-- CreateIndex
CREATE UNIQUE INDEX "TrelloCardFileLink_card_id_file_id_key" ON "TrelloCardFileLink"("card_id", "file_id");

-- CreateIndex
CREATE INDEX "TrelloCardEmailLink_card_id_idx" ON "TrelloCardEmailLink"("card_id");

-- CreateIndex
CREATE INDEX "TrelloCardEmailLink_email_id_idx" ON "TrelloCardEmailLink"("email_id");

-- CreateIndex
CREATE INDEX "TrelloCardEmailLink_link_type_idx" ON "TrelloCardEmailLink"("link_type");

-- CreateIndex
CREATE UNIQUE INDEX "TrelloCardEmailLink_card_id_email_id_key" ON "TrelloCardEmailLink"("card_id", "email_id");

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailFileLink" ADD CONSTRAINT "EmailFileLink_email_id_fkey" FOREIGN KEY ("email_id") REFERENCES "Email"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailFileLink" ADD CONSTRAINT "EmailFileLink_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrelloBoard" ADD CONSTRAINT "TrelloBoard_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrelloCard" ADD CONSTRAINT "TrelloCard_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "TrelloBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrelloCard" ADD CONSTRAINT "TrelloCard_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrelloCardFileLink" ADD CONSTRAINT "TrelloCardFileLink_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "TrelloCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrelloCardFileLink" ADD CONSTRAINT "TrelloCardFileLink_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrelloCardEmailLink" ADD CONSTRAINT "TrelloCardEmailLink_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "TrelloCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrelloCardEmailLink" ADD CONSTRAINT "TrelloCardEmailLink_email_id_fkey" FOREIGN KEY ("email_id") REFERENCES "Email"("id") ON DELETE CASCADE ON UPDATE CASCADE;
