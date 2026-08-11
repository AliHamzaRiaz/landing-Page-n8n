-- Meta phone_number_id must map to at most one WhatsAppAccount
CREATE UNIQUE INDEX IF NOT EXISTS "WhatsAppAccount_phoneNumberId_key" ON "WhatsAppAccount"("phoneNumberId");
