CREATE TABLE IF NOT EXISTS "category" (
	"tenant_id" uuid,
	"category_id" uuid,
	"name" varchar,
	"monthly_spend_goal" integer,
	"yearly_spend_goal" integer,
	"created_at" timestamp,
	"updated_at" timestamp,
	"is_immutable" boolean,
	CONSTRAINT "category_tenant_id_category_id_pk" PRIMARY KEY("tenant_id","category_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "outbox" (
	"message_id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp,
	"topic_name" varchar,
	"payload" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "plaid_item" (
	"institution_id" varchar,
	"institution_name" varchar,
	"tenant_id" uuid,
	"access_token" varchar,
	"transaction_cursor" varchar,
	CONSTRAINT "plaid_item_tenant_id_institution_id_pk" PRIMARY KEY("tenant_id","institution_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recategorization_log" (
	"tenant_id" uuid,
	"recategorization_id" uuid,
	"transaction_id" varchar,
	"old_category_id" uuid,
	"new_category_id" uuid,
	"created_at" timestamp,
	CONSTRAINT "recategorization_log_tenant_id_recategorization_id_pk" PRIMARY KEY("tenant_id","recategorization_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subcategory" (
	"tenant_id" uuid,
	"category_id" uuid,
	"subcategory_id" uuid,
	"name" varchar,
	"monthly_spend_goal" integer,
	"yearly_spend_goal" integer,
	"created_at" timestamp,
	"updated_at" timestamp,
	"is_immutable" boolean,
	CONSTRAINT "subcategory_tenant_id_subcategory_id_pk" PRIMARY KEY("tenant_id","subcategory_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transaction" (
	"tenant_id" uuid,
	"category_id" uuid,
	"transaction_id" varchar,
	"description" varchar,
	"type" varchar,
	"amount" numeric(15, 2),
	"status" varchar,
	"date" date,
	"created_at" timestamp,
	"updated_at" timestamp,
	"plaid_details" jsonb,
	CONSTRAINT "transaction_tenant_id_transaction_id_pk" PRIMARY KEY("tenant_id","transaction_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "outbox_created_at_idx" ON "outbox" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recategorization_log_transaction_id_idx" ON "recategorization_log" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transaction_date_idx" ON "transaction" USING btree ("date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tenant_id_category_id_date_idx" ON "transaction" USING btree ("tenant_id","category_id","date");