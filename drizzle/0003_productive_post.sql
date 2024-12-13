CREATE TABLE IF NOT EXISTS "recategorization_log" (
	"tenant_id" uuid,
	"recategorization_id" uuid,
	"transaction_id" uuid,
	"old_category_name" varchar,
	"new_category_name" varchar,
	"created_at" timestamp,
	CONSTRAINT "recategorization_log_tenant_id_recategorization_id_pk" PRIMARY KEY("tenant_id","recategorization_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recategorization_log_transaction_id_idx" ON "recategorization_log" USING btree ("transaction_id");