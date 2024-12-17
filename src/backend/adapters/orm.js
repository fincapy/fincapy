import {
  integer,
  numeric,
  pgTable,
  varchar,
  primaryKey,
  index,
  uuid,
  timestamp,
  jsonb,
  date,
  boolean,
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

export const categoryTable = pgTable(
  'category',
  {
    tenantId: uuid('tenant_id'),
    categoryId: uuid('category_id'),
    name: varchar('name'),
    monthlyGoal: integer('monthly_goal'),
    createdAt: timestamp('created_at'),
    updatedAt: timestamp('updated_at'),
    isImmutable: boolean('is_immutable'),
    type: varchar('type'),
  },
  (table) => {
    return [primaryKey({ columns: [table.tenantId, table.categoryId] })];
  }
);

export const subcategoryTable = pgTable(
  'subcategory',
  {
    tenantId: uuid('tenant_id'),
    categoryId: uuid('category_id'),
    subcategoryId: uuid('subcategory_id'),
    name: varchar('name'),
    monthlyGoal: integer('monthly_goal'),
    createdAt: timestamp('created_at'),
    updatedAt: timestamp('updated_at'),
    isImmutable: boolean('is_immutable'),
    type: varchar('type'),
  },
  (table) => {
    return [primaryKey({ columns: [table.tenantId, table.subcategoryId] })];
  }
);

export const transactionTable = pgTable(
  'transaction',
  {
    tenantId: uuid('tenant_id'),
    categoryId: uuid('category_id'),
    transactionId: varchar('transaction_id'),
    description: varchar('description'),
    type: varchar('type'),
    amount: numeric('amount', { precision: 15, scale: 2 }),
    status: varchar('status'),
    date: date('date'),
    createdAt: timestamp('created_at'),
    updatedAt: timestamp('updated_at'),
    plaidDetails: jsonb('plaid_details'),
  },
  (table) => {
    return [
      primaryKey({ columns: [table.tenantId, table.transactionId] }),
      index('transaction_date_idx').on(table.date),
      index('tenant_id_category_id_date_idx').on(
        table.tenantId,
        table.categoryId,
        table.date
      ),
    ];
  }
);

export const recategorizationLogTable = pgTable(
  'recategorization_log',
  {
    tenantId: uuid('tenant_id'),
    recategorizationId: uuid('recategorization_id'),
    transactionId: varchar('transaction_id'),
    oldCategoryId: uuid('old_category_id'),
    newCategoryId: uuid('new_category_id'),
    createdAt: timestamp('created_at'),
  },
  (table) => {
    return [
      primaryKey({ columns: [table.tenantId, table.recategorizationId] }),
      index('recategorization_log_transaction_id_idx').on(table.transactionId),
    ];
  }
);

export const outboxTable = pgTable(
  'outbox',
  {
    messageId: varchar('message_id').primaryKey(),
    createdAt: timestamp('created_at'),
    topicName: varchar('topic_name'),
    payload: jsonb('payload'),
  },
  (table) => {
    return [index('outbox_created_at_idx').on(table.createdAt)];
  }
);
