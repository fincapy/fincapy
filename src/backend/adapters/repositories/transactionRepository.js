import { transactionTable } from '../orm';
import { eq, and } from 'drizzle-orm';
import { Transaction } from '@/backend/domain/transaction';

class TransactionRepository {
  constructor({ tx }) {
    this.tx = tx;
  }

  async get({ tenantId, transactionId }) {
    const result = await this.tx
      .select()
      .from(transactionTable)
      .where(
        and(
          eq(transactionTable.tenantId, tenantId),
          eq(transactionTable.transactionId, transactionId)
        )
      );

    if (result.length === 0) {
      return null;
    }

    return new Transaction({
      tenantId: result[0].tenantId,
      transactionId: result[0].transactionId,
      createdAt: result[0].createdAt,
      updatedAt: result[0].updatedAt,
      categoryId: result[0].categoryId,
      amount: result[0].amount,
      date: result[0].date,
      description: result[0].description,
      category: result[0].category,
      type: result[0].type,
      plaidDetails: result[0].plaidDetails,
    });
  }

  async add(transaction) {
    await this.tx.insert(transactionTable).values({ ...transaction });
  }

  async update(transaction) {
    await this.tx
      .update(transactionTable)
      .set({ ...transaction })
      .where(
        and(
          eq(transactionTable.tenantId, transaction.tenantId),
          eq(transactionTable.transactionId, transaction.transactionId)
        )
      );
  }

  async remove({ tenantId, transactionId }) {
    await this.tx
      .delete(transactionTable)
      .where(
        and(
          eq(transactionTable.tenantId, tenantId),
          eq(transactionTable.transactionId, transactionId)
        )
      );
  }
}

export { TransactionRepository };
