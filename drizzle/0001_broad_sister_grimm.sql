CREATE TABLE IF NOT EXISTS "outbox" (
	"message_id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp,
	"topic_name" varchar,
	"payload" varchar
);
--> statement-breakpoint
ALTER TABLE "plaid_item" ADD COLUMN "transaction_cursor" varchar;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "outbox_created_at_idx" ON "outbox" USING btree ("created_at");