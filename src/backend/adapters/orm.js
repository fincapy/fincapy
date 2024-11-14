import {
  integer,
  pgTable,
  varchar,
  primaryKey,
  uuid,
  timestamp,
} from 'drizzle-orm/pg-core';

export const tenant = pgTable('tenant', {
  tenantId: uuid('tenant_id'),
  plaidAccessToken: varchar('plaid_access_token'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

export const categories = pgTable(
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
