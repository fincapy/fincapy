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
	"institution_id" varchar,
	"institution_name" varchar,
	"tenant_id" uuid,
	"access_token" varchar,
	CONSTRAINT "plaid_item_tenant_id_institution_id_pk" PRIMARY KEY("tenant_id","institution_id")
);
