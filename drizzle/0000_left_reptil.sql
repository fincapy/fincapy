CREATE TABLE IF NOT EXISTS "category" (
	"tenant_id" uuid,
	"category_id" uuid,
	"name" varchar,
	"spend_goal" integer,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "category_tenant_id_category_id_pk" PRIMARY KEY("tenant_id","category_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "plaid_item" (
	"id" uuid,
	"tenant_id" uuid,
	"access_token" varchar,
	CONSTRAINT "plaid_item_tenant_id_id_pk" PRIMARY KEY("tenant_id","id")
);
