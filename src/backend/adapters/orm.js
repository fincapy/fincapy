import {
  integer,
  pgTable,
  varchar,
  primaryKey,
  uuid,
  timestamp,
} from 'drizzle-orm/pg-core';

export const plaidItemTable = pgTable(
  'plaid_item',
  {
    id: uuid('id'),
    tenantId: uuid('tenant_id'),
    accessToken: varchar('access_token'),
  },
  (table) => {
    return [primaryKey({ columns: [table.tenantId, table.id] })];
  }
);

export const categoriesTable = pgTable(
  'category',
  {
    tenantId: uuid('tenant_id'),
    categoryId: uuid('category_id'),
    name: varchar('name'),
    spendGoal: integer('spend_goal'),
    createdAt: timestamp('created_at'),
    updatedAt: timestamp('updated_at'),
  },
  (table) => {
    return [primaryKey({ columns: [table.tenantId, table.categoryId] })];
  }
);
