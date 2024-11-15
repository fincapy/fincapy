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
CREATE TABLE IF NOT EXISTS "tenant" (
	"tenant_id" uuid,
	"plaid_access_token" varchar,
	"created_at" timestamp,
	"updated_at" timestamp
);
