import { eq } from 'drizzle-orm';
import {
  spendingCategoryTable,
  spendingSubcategoryTable,
  recategorizationLogTable,
  transactionTable,
} from '../adapters/orm';
import { Transaction } from '../domain/transaction';
import { type } from 'os';

class CreateTransactionService {
  constructor({ transactionRepositoryFactory, db, openaiAdapter }) {
    this.transactionRepositoryFactory = transactionRepositoryFactory;
    this.db = db;
    this.openaiAdapter = openaiAdapter;
  }
  async getCategories(tenantId) {
    const result = await this.db
      .select({
        categoryName: spendingCategoryTable.name,
        categoryId: spendingCategoryTable.spendingCategoryId,
        subcategoryName: spendingSubcategoryTable.name,
        subcategoryId: spendingSubcategoryTable.spendingSubcategoryId,
      })
      .from(spendingCategoryTable)
      .where(eq(spendingCategoryTable.tenantId, tenantId))
      .leftJoin(
        spendingSubcategoryTable,
        eq(
          spendingCategoryTable.spendingCategoryId,
          spendingSubcategoryTable.spendingCategoryId
        )
      );

    // Transform the result to the desired structure
    const formattedResult = result.flatMap(
      ({ categoryName, subcategoryName, categoryId, subcategoryId }) =>
        subcategoryName
          ? [
              {
                categoryName: `${categoryName.toLowerCase().replace(' ', '_')}.${subcategoryName.toLowerCase().replace(' ', '_')}`,
                categoryId: subcategoryId,
              },
            ]
          : [
              {
                categoryName: `${categoryName.toLowerCase().replace(' ', '_')}`,
                categoryId: categoryId,
              },
            ]
    );

    const categoryIdToNameMap = {};
    formattedResult.forEach((item) => {
      categoryIdToNameMap[item.categoryId] = item.categoryName;
    });
    return categoryIdToNameMap;
  }

  async getRecategorizations(tenantId, categoryIdToNameMap) {
    const result = await this.db
      .select({
        oldCategoryId: recategorizationLogTable.oldCategoryId,
        newCategoryId: recategorizationLogTable.newCategoryId,
      })
      .from(recategorizationLogTable)
      .where(eq(recategorizationLogTable.tenantId, tenantId))
      .leftJoin(
        transactionTable,
        eq(
          recategorizationLogTable.transactionId,
          transactionTable.transactionId
        )
      );

    const scrubbedResult = result.map((row) => {
      return {
        description: row.transaction?.description,
        type: row.transaction?.type,
        amount: row.transaction?.amount,
        oldCategoryName: categoryIdToNameMap[row.oldCategoryId],
        newCategoryName: categoryIdToNameMap[row.newCategoryId],
      };
    });
    return scrubbedResult;
  }

  async execute({ tenantId, transactionCreatedMessage }) {
    await this.db.transaction(async (tx) => {
      const transactionRepository = new this.transactionRepositoryFactory({
        tx,
      });

      const categoryIdToNameMap = await this.getCategories(tenantId);
      const recategorizedTransactions = await this.getRecategorizations(
        tenantId,
        categoryIdToNameMap
      );
      const transactionCategories =
        await this.openaiAdapter.categorizeTransaction({
          categoryIdToNameMap,
          recategorizedTransactions,
          transactionCreatedMessage,
        });

      const transaction = new Transaction({
        tenantId,
        transactionId: transactionCreatedMessage.payload.transactionId,
        createdAt: new Date(),
        updatedAt: new Date(),
        categoryId: transactionCategories.categoryId,
        amount: transactionCreatedMessage.payload.amount,
        date: transactionCreatedMessage.payload.date,
        status: transactionCreatedMessage.payload.pending
          ? 'PENDING'
          : 'COMPLETED',
        description: transactionCreatedMessage.payload.merchantName
          ? transactionCreatedMessage.payload.merchantName
          : transactionCreatedMessage.payload.originalDescription,
        category: transactionCategories.category,
        type: transactionCategories.type,
        plaidDetails: transactionCreatedMessage.payload,
      });

      await transactionRepository.add(transaction);
    });
  }
}

export { CreateTransactionService };
