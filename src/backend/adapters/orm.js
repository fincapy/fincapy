import {
  integer,
  pgTable,
  varchar,
  primaryKey,
  index,
  uuid,
  timestamp,
} from 'drizzle-orm/pg-core';

export const plaidItemTable = pgTable(
  'plaid_item',
  {
    institutionId: varchar('institution_id'),
    institutionName: varchar('institution_name'),
    tenantId: uuid('tenant_id'),
    accessToken: varchar('access_token'),
    transactionCursor: varchar('transaction_cursor'),
  },
  (table) => {
    return [primaryKey({ columns: [table.tenantId, table.institutionId] })];
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

export const outboxTable = pgTable(
  'outbox',
  {
    messageId: varchar('message_id').primaryKey(),
    createdAt: timestamp('created_at'),
    topicName: varchar('topic_name'),
    payload: varchar('payload'),
    createdAt: timestamp('created_at'),
  },
  (table) => {
    return [index('outbox_created_at_idx').on(table.createdAt)];
  }
);
