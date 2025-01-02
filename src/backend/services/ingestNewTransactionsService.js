import { Transaction } from '../domain/transaction';

class IngestNewTransactionsService {
  constructor({
    plaidAdapter,
    pubsubAdapter,
    tenantRepository,
    openaiAdapter,
  }) {
    this.plaidAdapter = plaidAdapter;
    this.tenantRepository = tenantRepository;
    this.pubsubAdapter = pubsubAdapter;
    this.openaiAdapter = openaiAdapter;
  }

  getCategoryNameToIdMap(plan) {
    const categoryIdToNameMap = {};
    plan.categories.forEach((category) => {
      categoryIdToNameMap[category.categoryId] = category.name
        .toLowerCase()
        .replace(' ', '_');
      category.subcategories.forEach((subcategory) => {
        categoryIdToNameMap[subcategory.subcategoryId] =
          `${category.name.toLowerCase().replace(' ', '_')}.${subcategory.name.toLowerCase().replace(' ', '_')}`;
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
        recategorizations: plan.recategorizations,
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

    const transaction = new Transaction({
      transactionId: plaidTransaction.transaction_id,
      updatedAt: plaidTransaction.datetime,
      amount: plaidTransaction.amount,
      date: plaidTransaction.date,
      status: plaidTransaction.pending ? 'PENDING' : 'COMPLETED',
      description: plaidTransaction.merchant_name
        ? plaidTransaction.merchant_name
        : plaidTransaction.original_description,
      type: aiTransactionCategories.type,
    });

    const category = plan.categories.find(
      (category) => category.categoryId === aiTransactionCategories.categoryId
    );
    if (category) {
      category.transactions.push(transaction);
    }
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
        recategorizations: plan.recategorizations,
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

    const transaction = new Transaction({
      transactionId: plaidTransaction.transaction_id,
      updatedAt: plaidTransaction.datetime,
      amount: plaidTransaction.amount,
      date: plaidTransaction.date,
      status: plaidTransaction.pending ? 'PENDING' : 'COMPLETED',
      description: plaidTransaction.merchant_name
        ? plaidTransaction.merchant_name
        : plaidTransaction.original_description,
      type: aiTransactionCategories.type,
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

  async execute({ tenantId, institutionId }) {
    const tenant = await this.tenantRepository.get({ tenantId });
    if (!tenant) {
      return null;
    }
    const plaidItem = tenant.plaidItems.find(
      (plaidItem) => plaidItem.institutionId === institutionId
    );
    if (!plaidItem) {
      return null;
    }

    try {
      await this.plaidAdapter.refreshTransactions({
        accessToken: plaidItem.accessToken,
      });
    } catch (error) {}

    const plaidTransactions = await this.plaidAdapter.getTransactions({
      accessToken: plaidItem.accessToken,
      cursor: plaidItem.cursor,
    });
    for (const plan of tenant.plans) {
      const categoryIdToNameMap = this.getCategoryNameToIdMap(plan);
      for (const plaidTransaction of plaidTransactions.added) {
        await this.addTransaction(
          plaidTransactions,
          plaidTransaction,
          plan,
          categoryIdToNameMap
        );
      }

      for (const plaidTransaction of plaidTransactions.modified) {
        await this.updateTransactions(
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
    await this.tenantRepository.put({ tenantId, tenant });
    return true;
  }
}

export { IngestNewTransactionsService };
