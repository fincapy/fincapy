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

export const spendingCategoryTable = pgTable(
  'spending_category',
  {
    tenantId: uuid('tenant_id'),
    spendingCategoryId: uuid('spending_category_id'),
    name: varchar('name'),
    monthlySpendGoal: integer('monthly_spend_goal'),
    yearlySpendGoal: integer('yearly_spend_goal'),
    createdAt: timestamp('created_at'),
    updatedAt: timestamp('updated_at'),
    isImmutable: boolean('is_immutable'),
  },
  (table) => {
    return [
      primaryKey({ columns: [table.tenantId, table.spendingCategoryId] }),
    ];
  }
);

export const spendingSubcategoryTable = pgTable(
  'spending_subcategory',
  {
    tenantId: uuid('tenant_id'),
    spendingCategoryId: uuid('spending_category_id'),
    spendingSubcategoryId: uuid('spending_subcategory_id'),
    name: varchar('name'),
    monthlySpendGoal: integer('monthly_spend_goal'),
    yearlySpendGoal: integer('yearly_spend_goal'),
    createdAt: timestamp('created_at'),
    updatedAt: timestamp('updated_at'),
    isImmutable: boolean('is_immutable'),
  },
  (table) => {
    return [
      primaryKey({ columns: [table.tenantId, table.spendingSubcategoryId] }),
    ];
  }
);

export const transactionTable = pgTable(
  'transaction',
  {
    tenantId: uuid('tenant_id'),
    categoryId: uuid('category_id'),
    subcategoryId: uuid('subcategory_id'),
    transactionId: uuid('transaction_id'),
    description: varchar('description'),
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
      index('tenant_id_subcategory_id_idx').on(
        table.tenantId,
        table.subcategoryId
      ),
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
