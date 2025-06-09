-- AlterTable
ALTER TABLE "File" ADD COLUMN     "docs_url" TEXT,
ADD COLUMN     "file_type" TEXT DEFAULT 'drive',
ADD COLUMN     "is_shared" BOOLEAN DEFAULT false;

-- CreateIndex
CREATE INDEX "File_file_type_idx" ON "File"("file_type");

-- CreateIndex
CREATE INDEX "File_file_type_user_id_idx" ON "File"("file_type", "user_id");
