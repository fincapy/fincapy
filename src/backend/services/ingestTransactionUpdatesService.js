import {
  Transaction,
  incomeTransactionTypes,
  spendingTransactionTypes,
} from '../domain/transaction.js';

class IngestTransactionUpdatesService {
  constructor({ plaidAdapter, transactionManager, openaiAdapter }) {
    this.plaidAdapter = plaidAdapter;
    this.transactionManager = transactionManager;
    this.openaiAdapter = openaiAdapter;
  }

  getCategoryNameToIdMap(plan) {
    const categoryIdToNameMap = {};
    plan.categories.forEach((category) => {
      categoryIdToNameMap[category.categoryId] =
        `${category.type}.${category.name.toLowerCase().replace(' ', '_')}`;
      category.subcategories.forEach((subcategory) => {
        categoryIdToNameMap[subcategory.subcategoryId] =
          `${category.type}.${category.name.toLowerCase().replace(' ', '_')}.${subcategory.name.toLowerCase().replace(' ', '_')}`;
      });
    });
    return categoryIdToNameMap;
  }

  async addTransaction(
    plaidTransactions,
    plaidTransaction,
    plan,
    categoryIdToNameMap
  ) {
    const aiTransactionCategories =
      await this.openaiAdapter.categorizeTransaction({
        categoryIdToNameMap,
        transactionEdits: plan.transactionEdits,
        transactionAmount: plaidTransaction.amount,
        transactionCategory: plaidTransaction.personal_finance_category.primary,
        transactionCategoryConfidenceLevel:
          plaidTransaction.personal_finance_category.confidence_level,
        transactionMerchantName: plaidTransaction.merchant_name,
        transactionOriginalDescription: plaidTransaction.original_description,
        transactionAccountType:
          plaidTransactions.accounts[plaidTransaction.account_id].type,
        transactionSubAccountType:
          plaidTransactions.accounts[plaidTransaction.account_id].subtype,
      });

    let amount = plaidTransaction.amount;
    if (incomeTransactionTypes.includes(aiTransactionCategories.type)) {
      amount = Math.abs(amount);
    }

    const transaction = new Transaction({
      transactionId: plaidTransaction.transaction_id,
      amount: amount,
      date: plaidTransaction.date,
      status: plaidTransaction.pending ? 'PENDING' : 'COMPLETED',
      description: plaidTransaction.merchant_name
        ? plaidTransaction.merchant_name
        : plaidTransaction.original_description,
      type: aiTransactionCategories.type,
      createdByUser: false,
    });

    const category = plan.categories.find(
      (category) => category.categoryId === aiTransactionCategories.categoryId
    );
    if (category) {
      const existingTransaction = category.transactions.find(
        (existingTransaction) =>
          existingTransaction.transactionId === transaction.transactionId
      );
      if (!existingTransaction) {
        category.transactions.push(transaction);
      }
    }
    plan.categories.forEach((category) => {
      category.subcategories.forEach((subcategory) => {
        if (subcategory.subcategoryId === aiTransactionCategories.categoryId) {
          const existingTransaction = subcategory.transactions.find(
            (existingTransaction) =>
              existingTransaction.transactionId === transaction.transactionId
          );
          if (!existingTransaction) {
            subcategory.transactions.push(transaction);
          }
        }
      });
    });
  }

  async updateTransaction(
    plaidTransactions,
    plaidTransaction,
    plan,
    categoryIdToNameMap
  ) {
    const aiTransactionCategories =
      await this.openaiAdapter.categorizeTransaction({
        categoryIdToNameMap,
        transactionEdits: plan.transactionEdits,
        transactionAmount: plaidTransaction.amount,
        transactionCategory: plaidTransaction.personal_finance_category.primary,
        transactionCategoryConfidenceLevel:
          plaidTransaction.personal_finance_category.confidence_level,
        transactionMerchantName: plaidTransaction.merchant_name,
        transactionOriginalDescription: plaidTransaction.original_description,
        transactionAccountType:
          plaidTransactions.accounts[plaidTransaction.account_id].type,
        transactionSubAccountType:
          plaidTransactions.accounts[plaidTransaction.account_id].subtype,
      });

    let amount = plaidTransaction.amount;
    if (incomeTransactionTypes.includes(aiTransactionCategories.type)) {
      amount = Math.abs(amount);
    }

    const transaction = new Transaction({
      transactionId: plaidTransaction.transaction_id,
      amount: amount,
      date: plaidTransaction.date,
      status: plaidTransaction.pending ? 'PENDING' : 'COMPLETED',
      description: plaidTransaction.merchant_name
        ? plaidTransaction.merchant_name
        : plaidTransaction.original_description,
      type: aiTransactionCategories.type,
      createdByUser: false,
    });

    plan.categories.forEach((category) => {
      category.transactions = category.transactions.filter(
        (transaction) =>
          transaction.transactionId !== plaidTransaction.transaction_id
      );

      if (category.categoryId === aiTransactionCategories.categoryId) {
        category.transactions.push(transaction);
      }

      category.subcategories.forEach((subcategory) => {
        subcategory.transactions = subcategory.transactions.filter(
          (transaction) =>
            transaction.transactionId !== plaidTransaction.transaction_id
        );

        if (subcategory.subcategoryId === aiTransactionCategories.categoryId) {
          subcategory.transactions.push(transaction);
        }
      });
    });
  }

  async removeTransaction(plaidTransaction, plan) {
    plan.categories.forEach((category) => {
      category.transactions = category.transactions.filter(
        (transaction) =>
          transaction.transactionId !== plaidTransaction.transaction_id
      );

      category.subcategories.forEach((subcategory) => {
        subcategory.transactions = subcategory.transactions.filter(
          (transaction) =>
            transaction.transactionId !== plaidTransaction.transaction_id
        );
      });
    });
  }

  async execute({ tenantId, plaidItemId }) {
    console.log('ingest update service executing');
    await this.transactionManager.transaction(async ({ tenantRepository }) => {
      const tenant = await tenantRepository.get({
        tenantId,
      });
      if (!tenant) {
        return null;
      }
      let plaidItems = tenant.plaidItems;
      if (plaidItemId) {
        plaidItems = plaidItems.filter(
          (plaidItem) => plaidItem.plaidItemId === plaidItemId
        );
      }
      if (plaidItems.length === 0) {
        return null;
      }
      for (const plaidItem of plaidItems) {
        // try {
        //   await this.plaidAdapter.refreshTransactions({
        //     accessToken: plaidItem.accessToken,
        //   });
        // } catch (error) {}

        const plaidTransactions = await this.plaidAdapter.getTransactions({
          accessToken: plaidItem.accessToken,
          cursor: plaidItem.cursor,
        });
        for (const plan of tenant.plans) {
          const categoryIdToNameMap = this.getCategoryNameToIdMap(plan);
          await Promise.all(
            plaidTransactions.added.map((plaidTransaction) =>
              this.addTransaction(
                plaidTransactions,
                plaidTransaction,
                plan,
                categoryIdToNameMap
              )
            )
          );

          for (const plaidTransaction of plaidTransactions.modified) {
            await this.updateTransaction(
              plaidTransactions,
              plaidTransaction,
              plan,
              categoryIdToNameMap
            );
          }

          for (const plaidTransaction of plaidTransactions.removed) {
            await this.removeTransaction(plaidTransaction, plan);
          }
        }
        plaidItem.cursor = plaidTransactions.next_cursor;
      }
      await tenantRepository.set({ tenantId, tenant });
      return true;
    });
  }
}

export { IngestTransactionUpdatesService };
