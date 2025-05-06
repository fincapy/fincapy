import {
  Transaction,
  incomeTransactionTypes,
  spendingTransactionTypes,
} from '../domain/transaction.js';

class IngestTransactionUpdatesService {
  constructor({ plaidAdapter, transactionManager, openaiAdapter, sesAdapter }) {
    this.plaidAdapter = plaidAdapter;
    this.transactionManager = transactionManager;
    this.openaiAdapter = openaiAdapter;
    this.sesAdapter = sesAdapter;
  }

  getCategoryNameToIdMap(plan) {
    const categoryIdToNameMap = {};
    plan.categories.forEach((category) => {
      if (category.categoryId.includes('other')) {
        categoryIdToNameMap[category.categoryId] =
          `${category.type}.${category.name.toLowerCase().replaceAll(' ', '_')}`;
      }
      category.subcategories.forEach((subcategory) => {
        categoryIdToNameMap[subcategory.subcategoryId] =
          `${category.type}.${category.name.toLowerCase().replaceAll(' ', '_')}.${subcategory.name.toLowerCase().replaceAll(' ', '_')}`;
      });
    });
    return categoryIdToNameMap;
  }

  /**
   * Determine transaction type based on Plaid's transaction details
   * @private
   */
  _determineTransactionType(plaidTransactions, plaidTransaction) {
    const detailedCategory =
      plaidTransaction.personal_finance_category.detailed;

    // Credit card payment
    if (detailedCategory === 'LOAN_PAYMENTS_CREDIT_CARD_PAYMENT') {
      return 'credit_card_payment';
    }

    // Account transfers with potential matching transactions
    if (detailedCategory === 'TRANSFER_IN_ACCOUNT_TRANSFER') {
      return this._handleTransferIn(plaidTransactions, plaidTransaction);
    }

    if (detailedCategory === 'TRANSFER_OUT_ACCOUNT_TRANSFER') {
      return this._handleTransferOut(plaidTransactions, plaidTransaction);
    }

    // Income categories
    if (this._isIncomeCategory(detailedCategory)) {
      return 'income';
    }

    // Spending categories
    if (this._isSpendingCategory(detailedCategory)) {
      return 'spending';
    }

    // Other transfers
    if (detailedCategory.startsWith('TRANSFER_')) {
      return 'transfer';
    }

    // Default cases based on amount
    return plaidTransaction.amount < 0 ? 'refund' : 'spending';
  }

  /**
   * Check if detailed category represents income
   * @private
   */
  _isIncomeCategory(detailedCategory) {
    return (
      detailedCategory.startsWith('INCOME_') ||
      detailedCategory === 'TRANSFER_IN_DEPOSIT' ||
      detailedCategory === 'TRANSFER_IN_CASH_ADVANCES_AND_LOANS' ||
      detailedCategory === 'TRANSFER_IN_OTHER_TRANSFER_IN'
    );
  }

  /**
   * Check if detailed category represents spending
   * @private
   */
  _isSpendingCategory(detailedCategory) {
    return (
      detailedCategory === 'TRANSFER_OUT_WITHDRAWAL' ||
      detailedCategory === 'TRANSFER_OUT_OTHER_TRANSFER_OUT'
    );
  }

  /**
   * Handle transfer in transactions
   * @private
   */
  _handleTransferIn(plaidTransactions, plaidTransaction) {
    const contraTransaction = this._findMatchingTransfer(
      plaidTransactions,
      plaidTransaction,
      'TRANSFER_OUT_ACCOUNT_TRANSFER'
    );

    return contraTransaction ? 'transfer' : 'income';
  }

  /**
   * Handle transfer out transactions
   * @private
   */
  _handleTransferOut(plaidTransactions, plaidTransaction) {
    const contraTransaction = this._findMatchingTransfer(
      plaidTransactions,
      plaidTransaction,
      'TRANSFER_IN_ACCOUNT_TRANSFER'
    );

    return contraTransaction ? 'transfer' : 'spending';
  }

  /**
   * Find matching transfer transaction
   * @private
   */
  _findMatchingTransfer(
    plaidTransactions,
    plaidTransaction,
    detailedCategoryToMatch
  ) {
    return plaidTransactions.added.find(
      (transaction) =>
        transaction.amount === plaidTransaction.amount * -1 &&
        transaction.personal_finance_category.detailed ===
          detailedCategoryToMatch
    );
  }

  async addTransaction(
    plaidTransactions,
    plaidTransaction,
    plan,
    uniqueTransactionEditsString,
    categoryIdToNameMap
  ) {
    const transactionType = this._determineTransactionType(
      plaidTransactions,
      plaidTransaction
    );
    let transactionCategory;

    if (['spending', 'refund'].includes(transactionType)) {
      // filter categoryIdToNameMap to only include category id keys that have values prepended with spending.
      const spendingCategoryIdToNameMap = Object.fromEntries(
        Object.entries(categoryIdToNameMap).filter(([key, value]) =>
          value.startsWith('spending.')
        )
      );

      transactionCategory = await this.openaiAdapter.getTransactionCategory({
        categoryIdToNameMap: spendingCategoryIdToNameMap,
        transactionEdits: uniqueTransactionEditsString,
        transactionAmount: plaidTransaction.amount,
        transactionOriginalDescription: plaidTransaction.original_description,
        plaidSuggestedCategory:
          plaidTransaction.personal_finance_category.detailed,
      });
    }

    if (
      transactionType === 'credit_card_payment' ||
      transactionType === 'transfer'
    ) {
      transactionCategory = {
        categoryId: null,
      };
    }

    if (transactionType === 'income') {
      const incomeCategoryIdToNameMap = Object.fromEntries(
        Object.entries(categoryIdToNameMap).filter(([key, value]) =>
          value.startsWith('income.')
        )
      );

      transactionCategory = await this.openaiAdapter.getTransactionCategory({
        categoryIdToNameMap: incomeCategoryIdToNameMap,
        transactionEdits: uniqueTransactionEditsString,
        transactionAmount: plaidTransaction.amount,
        transactionOriginalDescription: plaidTransaction.original_description,
        plaidSuggestedCategory:
          plaidTransaction.personal_finance_category.detailed,
      });
    }

    let amount = plaidTransaction.amount;
    if (incomeTransactionTypes.includes(transactionType)) {
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
      type: transactionType,
      createdByUser: false,
    });

    if (
      !spendingTransactionTypes.includes(transaction.type) &&
      !incomeTransactionTypes.includes(transaction.type)
    ) {
      plan.transactions.push(transaction);
      return;
    }

    const category = plan.categories.find(
      (category) => category.categoryId === transactionCategory?.categoryId
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
        if (subcategory.subcategoryId === transactionCategory?.categoryId) {
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
    uniqueTransactionEditsString,
    categoryIdToNameMap
  ) {
    // First, determine transaction type
    const transactionType = this._determineTransactionType(
      plaidTransactions,
      plaidTransaction
    );

    // Get the category from OpenAI
    const transactionCategory = await this.openaiAdapter.getTransactionCategory(
      {
        categoryIdToNameMap,
        transactionEdits: uniqueTransactionEditsString,
        transactionAmount: plaidTransaction.amount,
        transactionOriginalDescription: plaidTransaction.original_description,
        plaidSuggestedCategory:
          plaidTransaction.personal_finance_category.detailed,
      }
    );

    let amount = plaidTransaction.amount;
    if (incomeTransactionTypes.includes(transactionCategory.type)) {
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
      type: transactionType,
      createdByUser: false,
    });

    plan.transactions = plan.transactions.filter(
      (transaction) =>
        transaction.transactionId !== plaidTransaction.transaction_id
    );

    if (
      !spendingTransactionTypes.includes(transaction.type) &&
      !incomeTransactionTypes.includes(transaction.type)
    ) {
      plan.transactions.push(transaction);
      return;
    }

    plan.categories.forEach((category) => {
      category.transactions = category.transactions.filter(
        (transaction) =>
          transaction.transactionId !== plaidTransaction.transaction_id
      );

      if (category.categoryId === transactionCategory.categoryId) {
        category.transactions.push(transaction);
      }

      category.subcategories.forEach((subcategory) => {
        subcategory.transactions = subcategory.transactions.filter(
          (transaction) =>
            transaction.transactionId !== plaidTransaction.transaction_id
        );

        if (subcategory.subcategoryId === transactionCategory.categoryId) {
          subcategory.transactions.push(transaction);
        }
      });
    });
  }

  async removeTransaction(plaidTransaction, plan) {
    plan.transactions = plan.transactions.filter(
      (transaction) =>
        transaction.transactionId !== plaidTransaction.transaction_id
    );

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

        try {
          const plaidTransactions = await this.plaidAdapter.getTransactions({
            accessToken: plaidItem.accessToken,
            cursor: plaidItem.cursor,
          });
          for (const plan of tenant.plans) {
            const categoryIdToNameMap = this.getCategoryNameToIdMap(plan);
            const categoryChangeTransactionEdits = plan.transactionEdits
              .filter(
                (edit) =>
                  edit.oldTransactionCategory !== edit.newTransactionCategory
              )
              .map((edit) => ({
                created_at: edit.createdAt,
                description: edit.oldTransactionDescription,
                original_category: edit.oldTransactionCategory,
                user_override_category: edit.newTransactionCategory,
              }));

            const uniqueCategoryChangeTransactionEdits =
              categoryChangeTransactionEdits
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) // Sort by date descending (newest first)
                .filter(
                  (edit, index, self) =>
                    self.findIndex(
                      (t) => t.description === edit.description
                    ) === index
                )
                .sort(
                  (a, b) => new Date(a.created_at) - new Date(b.created_at)
                );

            const uniqueTransactionEditsString = JSON.stringify(
              uniqueCategoryChangeTransactionEdits,
              null,
              2
            );

            const batchSize = 50;
            const addedTransactions = plaidTransactions.added;

            for (let i = 0; i < addedTransactions.length; i += batchSize) {
              const batch = addedTransactions.slice(i, i + batchSize);
              await Promise.all(
                batch.map((plaidTransaction) =>
                  this.addTransaction(
                    plaidTransactions,
                    plaidTransaction,
                    plan,
                    uniqueTransactionEditsString,
                    categoryIdToNameMap
                  )
                )
              );
            }

            for (const plaidTransaction of plaidTransactions.modified) {
              await this.updateTransaction(
                plaidTransactions,
                plaidTransaction,
                plan,
                uniqueTransactionEditsString,
                categoryIdToNameMap
              );
            }

            for (const plaidTransaction of plaidTransactions.removed) {
              await this.removeTransaction(plaidTransaction, plan);
            }
          }
          plaidItem.cursor = plaidTransactions.next_cursor;
          plaidItem.lastIngestedAt = new Date();
        } catch (error) {
          console.error('error ingesting transactions for plaidItem', error);
          if (error.response?.data?.error_code === 'ITEM_LOGIN_REQUIRED') {
            plaidItem.status = 'item_login_required';
            const primaryEmail = tenant.users.find(
              (user) => user.role === 'owner'
            ).emails[0].email;
            await this.sesAdapter.sendEmail({
              to: primaryEmail,
              subject: 'Fincapy Financial Institution Connection Expired',
              text: `Your connection to ${plaidItem.institutionName} has expired. Please relink on the Financial Institutions page to continue ingesting transactions.`,
            });
          }
        }
      }
      await tenantRepository.set({ tenantId, tenant });
      return true;
    });
  }
}

export { IngestTransactionUpdatesService };
