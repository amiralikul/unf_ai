-- CreateTable
CREATE TABLE "EmailFileAttachment" (
    "emailId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,

    CONSTRAINT "EmailFileAttachment_pkey" PRIMARY KEY ("emailId","fileId")
);

-- CreateIndex
CREATE INDEX "EmailFileAttachment_fileId_idx" ON "EmailFileAttachment"("fileId");

-- AddForeignKey
ALTER TABLE "EmailFileAttachment" ADD CONSTRAINT "EmailFileAttachment_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailFileAttachment" ADD CONSTRAINT "EmailFileAttachment_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
