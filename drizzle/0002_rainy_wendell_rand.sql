DROP INDEX IF EXISTS "tenant_id_subcategory_id_idx";--> statement-breakpoint
ALTER TABLE "transaction" ALTER COLUMN "transaction_id" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "type" varchar;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tenant_id_category_id_date_idx" ON "transaction" USING btree ("tenant_id","category_id","date");--> statement-breakpoint
ALTER TABLE "transaction" DROP COLUMN IF EXISTS "subcategory_id";