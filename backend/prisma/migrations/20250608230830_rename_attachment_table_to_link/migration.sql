/*
  Warnings:

  - You are about to drop the `EmailFileAttachment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "EmailFileAttachment" DROP CONSTRAINT "EmailFileAttachment_email_id_fkey";

-- DropForeignKey
ALTER TABLE "EmailFileAttachment" DROP CONSTRAINT "EmailFileAttachment_file_id_fkey";

-- DropTable
DROP TABLE "EmailFileAttachment";

-- CreateTable
CREATE TABLE "EmailFileLink" (
    "email_id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,

    CONSTRAINT "EmailFileLink_pkey" PRIMARY KEY ("email_id","file_id")
);

-- CreateIndex
CREATE INDEX "EmailFileLink_file_id_idx" ON "EmailFileLink"("file_id");

-- AddForeignKey
ALTER TABLE "EmailFileLink" ADD CONSTRAINT "EmailFileLink_email_id_fkey" FOREIGN KEY ("email_id") REFERENCES "Email"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailFileLink" ADD CONSTRAINT "EmailFileLink_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
