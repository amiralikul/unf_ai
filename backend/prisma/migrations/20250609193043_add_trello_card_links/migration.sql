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
ALTER TABLE "TrelloCardFileLink" ADD CONSTRAINT "TrelloCardFileLink_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "TrelloCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrelloCardFileLink" ADD CONSTRAINT "TrelloCardFileLink_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrelloCardEmailLink" ADD CONSTRAINT "TrelloCardEmailLink_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "TrelloCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrelloCardEmailLink" ADD CONSTRAINT "TrelloCardEmailLink_email_id_fkey" FOREIGN KEY ("email_id") REFERENCES "Email"("id") ON DELETE CASCADE ON UPDATE CASCADE;
