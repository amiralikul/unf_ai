-- AlterTable
ALTER TABLE "Email" ADD COLUMN     "recipientEmail" TEXT,
ADD COLUMN     "recipientName" TEXT,
ADD COLUMN     "senderEmail" TEXT,
ADD COLUMN     "senderName" TEXT,
ALTER COLUMN "sender" DROP NOT NULL,
ALTER COLUMN "recipient" DROP NOT NULL;

-- Data migration
-- This script parses the existing 'sender' and 'recipient' fields to populate the new columns.
-- It handles formats like "Name <email@example.com>" and just "email@example.com".
DO $$
DECLARE
    r RECORD;
    name_part TEXT;
    email_part TEXT;
    parsed_parts TEXT[];
BEGIN
    FOR r IN SELECT id, sender, recipient FROM "Email" LOOP
        -- Parse sender
        IF r.sender IS NOT NULL THEN
            parsed_parts := regexp_matches(r.sender, '^(.*?)<([^>]+)>$');
            IF array_length(parsed_parts, 1) = 2 THEN
                name_part := trim(parsed_parts[1]);
                email_part := trim(parsed_parts[2]);
            ELSE
                name_part := NULL;
                email_part := trim(r.sender);
            END IF;

            UPDATE "Email" SET "senderName" = name_part, "senderEmail" = email_part WHERE id = r.id;
        END IF;

        -- Parse recipient
        IF r.recipient IS NOT NULL THEN
            parsed_parts := regexp_matches(r.recipient, '^(.*?)<([^>]+)>$');
            IF array_length(parsed_parts, 1) = 2 THEN
                name_part := trim(parsed_parts[1]);
                email_part := trim(parsed_parts[2]);
            ELSE
                name_part := NULL;
                email_part := trim(r.recipient);
            END IF;

            UPDATE "Email" SET "recipientName" = name_part, "recipientEmail" = email_part WHERE id = r.id;
        END IF;
    END LOOP;
END;
$$;

-- CreateIndex
CREATE INDEX "Email_senderEmail_idx" ON "Email"("senderEmail");

-- CreateIndex
CREATE INDEX "Email_recipientEmail_idx" ON "Email"("recipientEmail");
