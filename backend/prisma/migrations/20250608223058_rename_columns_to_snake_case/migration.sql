/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `googleId` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `isImportant` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `isRead` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `receivedAt` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `recipientEmail` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `recipientName` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `senderEmail` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `senderName` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `threadId` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Email` table. All the data in the column will be lost.
  - The primary key for the `EmailFileAttachment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `emailId` on the `EmailFileAttachment` table. All the data in the column will be lost.
  - You are about to drop the column `fileId` on the `EmailFileAttachment` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `googleId` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `mimeType` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `modifiedAt` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `webViewLink` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `lastAccessed` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `sessionId` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `trelloId` on the `TrelloBoard` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `TrelloBoard` table. All the data in the column will be lost.
  - You are about to drop the column `boardId` on the `TrelloCard` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `TrelloCard` table. All the data in the column will be lost.
  - You are about to drop the column `dueDate` on the `TrelloCard` table. All the data in the column will be lost.
  - You are about to drop the column `listId` on the `TrelloCard` table. All the data in the column will be lost.
  - You are about to drop the column `listName` on the `TrelloCard` table. All the data in the column will be lost.
  - You are about to drop the column `trelloId` on the `TrelloCard` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `TrelloCard` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `TrelloCard` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `googleAccessToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `googleRefreshToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `trelloApiKey` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `trelloToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[google_id]` on the table `Email` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[google_id]` on the table `File` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[session_id]` on the table `Session` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[trello_id]` on the table `TrelloBoard` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[trello_id]` on the table `TrelloCard` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `google_id` to the `Email` table without a default value. This is not possible if the table is not empty.
  - Added the required column `received_at` to the `Email` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `Email` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email_id` to the `EmailFileAttachment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `file_id` to the `EmailFileAttachment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `google_id` to the `File` table without a default value. This is not possible if the table is not empty.
  - Added the required column `modified_at` to the `File` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `File` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expires_at` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `session_id` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trello_id` to the `TrelloBoard` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `TrelloBoard` table without a default value. This is not possible if the table is not empty.
  - Added the required column `board_id` to the `TrelloCard` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trello_id` to the `TrelloCard` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `TrelloCard` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Email" DROP CONSTRAINT "Email_userId_fkey";

-- DropForeignKey
ALTER TABLE "EmailFileAttachment" DROP CONSTRAINT "EmailFileAttachment_emailId_fkey";

-- DropForeignKey
ALTER TABLE "EmailFileAttachment" DROP CONSTRAINT "EmailFileAttachment_fileId_fkey";

-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_userId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- DropForeignKey
ALTER TABLE "TrelloBoard" DROP CONSTRAINT "TrelloBoard_userId_fkey";

-- DropForeignKey
ALTER TABLE "TrelloCard" DROP CONSTRAINT "TrelloCard_boardId_fkey";

-- DropForeignKey
ALTER TABLE "TrelloCard" DROP CONSTRAINT "TrelloCard_userId_fkey";

-- DropIndex
DROP INDEX "Email_googleId_key";

-- DropIndex
DROP INDEX "Email_isImportant_userId_idx";

-- DropIndex
DROP INDEX "Email_isRead_userId_idx";

-- DropIndex
DROP INDEX "Email_receivedAt_idx";

-- DropIndex
DROP INDEX "Email_recipientEmail_idx";

-- DropIndex
DROP INDEX "Email_senderEmail_idx";

-- DropIndex
DROP INDEX "Email_userId_idx";

-- DropIndex
DROP INDEX "EmailFileAttachment_fileId_idx";

-- DropIndex
DROP INDEX "File_googleId_key";

-- DropIndex
DROP INDEX "File_mimeType_idx";

-- DropIndex
DROP INDEX "File_modifiedAt_idx";

-- DropIndex
DROP INDEX "File_userId_idx";

-- DropIndex
DROP INDEX "Session_expiresAt_idx";

-- DropIndex
DROP INDEX "Session_sessionId_idx";

-- DropIndex
DROP INDEX "Session_sessionId_key";

-- DropIndex
DROP INDEX "Session_userId_idx";

-- DropIndex
DROP INDEX "TrelloBoard_trelloId_key";

-- DropIndex
DROP INDEX "TrelloBoard_userId_idx";

-- DropIndex
DROP INDEX "TrelloCard_boardId_idx";

-- DropIndex
DROP INDEX "TrelloCard_dueDate_idx";

-- DropIndex
DROP INDEX "TrelloCard_dueDate_userId_idx";

-- DropIndex
DROP INDEX "TrelloCard_priority_userId_idx";

-- DropIndex
DROP INDEX "TrelloCard_status_userId_idx";

-- DropIndex
DROP INDEX "TrelloCard_trelloId_key";

-- DropIndex
DROP INDEX "TrelloCard_userId_idx";

-- AlterTable
ALTER TABLE "Email" DROP COLUMN "createdAt",
DROP COLUMN "googleId",
DROP COLUMN "isImportant",
DROP COLUMN "isRead",
DROP COLUMN "receivedAt",
DROP COLUMN "recipientEmail",
DROP COLUMN "recipientName",
DROP COLUMN "senderEmail",
DROP COLUMN "senderName",
DROP COLUMN "threadId",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "google_id" TEXT NOT NULL,
ADD COLUMN     "is_important" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_read" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "received_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "recipient_email" TEXT,
ADD COLUMN     "recipient_name" TEXT,
ADD COLUMN     "sender_email" TEXT,
ADD COLUMN     "sender_name" TEXT,
ADD COLUMN     "thread_id" TEXT,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "EmailFileAttachment" DROP CONSTRAINT "EmailFileAttachment_pkey",
DROP COLUMN "emailId",
DROP COLUMN "fileId",
ADD COLUMN     "email_id" TEXT NOT NULL,
ADD COLUMN     "file_id" TEXT NOT NULL,
ADD CONSTRAINT "EmailFileAttachment_pkey" PRIMARY KEY ("email_id", "file_id");

-- AlterTable
ALTER TABLE "File" DROP COLUMN "createdAt",
DROP COLUMN "googleId",
DROP COLUMN "mimeType",
DROP COLUMN "modifiedAt",
DROP COLUMN "userId",
DROP COLUMN "webViewLink",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "google_id" TEXT NOT NULL,
ADD COLUMN     "mime_type" TEXT,
ADD COLUMN     "modified_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL,
ADD COLUMN     "web_view_link" TEXT;

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "createdAt",
DROP COLUMN "expiresAt",
DROP COLUMN "lastAccessed",
DROP COLUMN "sessionId",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expires_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "last_accessed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "session_id" TEXT NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TrelloBoard" DROP COLUMN "trelloId",
DROP COLUMN "userId",
ADD COLUMN     "trello_id" TEXT NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TrelloCard" DROP COLUMN "boardId",
DROP COLUMN "createdAt",
DROP COLUMN "dueDate",
DROP COLUMN "listId",
DROP COLUMN "listName",
DROP COLUMN "trelloId",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "board_id" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "due_date" TIMESTAMP(3),
ADD COLUMN     "list_id" TEXT,
ADD COLUMN     "list_name" TEXT,
ADD COLUMN     "trello_id" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "createdAt",
DROP COLUMN "googleAccessToken",
DROP COLUMN "googleRefreshToken",
DROP COLUMN "trelloApiKey",
DROP COLUMN "trelloToken",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "google_access_token" TEXT,
ADD COLUMN     "google_refresh_token" TEXT,
ADD COLUMN     "trello_api_key" TEXT,
ADD COLUMN     "trello_token" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Email_google_id_key" ON "Email"("google_id");

-- CreateIndex
CREATE INDEX "Email_user_id_idx" ON "Email"("user_id");

-- CreateIndex
CREATE INDEX "Email_received_at_idx" ON "Email"("received_at");

-- CreateIndex
CREATE INDEX "Email_sender_email_idx" ON "Email"("sender_email");

-- CreateIndex
CREATE INDEX "Email_recipient_email_idx" ON "Email"("recipient_email");

-- CreateIndex
CREATE INDEX "Email_is_read_user_id_idx" ON "Email"("is_read", "user_id");

-- CreateIndex
CREATE INDEX "Email_is_important_user_id_idx" ON "Email"("is_important", "user_id");

-- CreateIndex
CREATE INDEX "EmailFileAttachment_file_id_idx" ON "EmailFileAttachment"("file_id");

-- CreateIndex
CREATE UNIQUE INDEX "File_google_id_key" ON "File"("google_id");

-- CreateIndex
CREATE INDEX "File_user_id_idx" ON "File"("user_id");

-- CreateIndex
CREATE INDEX "File_modified_at_idx" ON "File"("modified_at");

-- CreateIndex
CREATE INDEX "File_mime_type_idx" ON "File"("mime_type");

-- CreateIndex
CREATE UNIQUE INDEX "Session_session_id_key" ON "Session"("session_id");

-- CreateIndex
CREATE INDEX "Session_session_id_idx" ON "Session"("session_id");

-- CreateIndex
CREATE INDEX "Session_user_id_idx" ON "Session"("user_id");

-- CreateIndex
CREATE INDEX "Session_expires_at_idx" ON "Session"("expires_at");

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
CREATE INDEX "TrelloCard_due_date_idx" ON "TrelloCard"("due_date");

-- CreateIndex
CREATE INDEX "TrelloCard_status_user_id_idx" ON "TrelloCard"("status", "user_id");

-- CreateIndex
CREATE INDEX "TrelloCard_priority_user_id_idx" ON "TrelloCard"("priority", "user_id");

-- CreateIndex
CREATE INDEX "TrelloCard_due_date_user_id_idx" ON "TrelloCard"("due_date", "user_id");

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailFileAttachment" ADD CONSTRAINT "EmailFileAttachment_email_id_fkey" FOREIGN KEY ("email_id") REFERENCES "Email"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailFileAttachment" ADD CONSTRAINT "EmailFileAttachment_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrelloBoard" ADD CONSTRAINT "TrelloBoard_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrelloCard" ADD CONSTRAINT "TrelloCard_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "TrelloBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrelloCard" ADD CONSTRAINT "TrelloCard_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
