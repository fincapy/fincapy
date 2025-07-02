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
  _determineTransactionType(
    plaidTransactions,
    plaidTransaction,
    transactionTypeEdits
  ) {
    let type = null;
    const detailedCategory =
      plaidTransaction.personal_finance_category.detailed;

    // Credit card payment
    if (detailedCategory === 'LOAN_PAYMENTS_CREDIT_CARD_PAYMENT') {
      if (
        plaidTransaction.personal_finance_category.confidence_level === 'LOW'
      ) {
        type = 'spending';
      } else {
        type = 'credit_card_payment';
      }
    }

    // Account transfers with potential matching transactions
    if (detailedCategory === 'TRANSFER_IN_ACCOUNT_TRANSFER') {
      type = this._handleTransferIn(plaidTransactions, plaidTransaction);
    }

    if (detailedCategory === 'TRANSFER_OUT_ACCOUNT_TRANSFER') {
      type = this._handleTransferOut(plaidTransactions, plaidTransaction);
    }

    // Income categories
    if (this._isIncomeCategory(detailedCategory)) {
      type = 'income';
    }

    // Spending categories
    if (this._isSpendingCategory(detailedCategory)) {
      type = 'spending';
    }

    // Other transfers
    if (detailedCategory.startsWith('TRANSFER_')) {
      type = 'transfer';
    }

    // Default cases based on amount
    type = plaidTransaction.amount < 0 ? 'refund' : 'spending';

    // Find the most recent transaction type edit for this description
    // transactionTypeEdits is already sorted by most recent first
    const edit = transactionTypeEdits.find(
      (edit) =>
        edit.oldTransactionDescription === plaidTransaction.original_description
    );
    if (edit) {
      type = edit.newTransactionType;
    }

    return type;
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
    uniqueCategoryChangeTransactionEdits,
    categoryIdToNameMap,
    plaidItemId
  ) {
    // Get transaction type edits, sorted by most recent first
    const transactionTypeEdits = plan.transactionEdits
      .filter((edit) => edit.oldTransactionType !== edit.newTransactionType)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const transactionType = this._determineTransactionType(
      plaidTransactions,
      plaidTransaction,
      transactionTypeEdits
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
        transactionAmount: plaidTransaction.amount,
        transactionOriginalDescription: plaidTransaction.original_description,
      });

      const overrideEdit = uniqueCategoryChangeTransactionEdits.find(
        (edit) =>
          edit.oldTransactionDescription ===
          plaidTransaction.original_description
      );
      if (overrideEdit) {
        const overrideCategoryName = overrideEdit.newTransactionCategory;
        const overrideCategoryId = Object.keys(
          spendingCategoryIdToNameMap
        ).find(
          (key) => spendingCategoryIdToNameMap[key] === overrideCategoryName
        );
        if (overrideCategoryId) {
          transactionCategory.category = overrideCategoryName;
          transactionCategory.categoryId = overrideCategoryId;
        }
      }
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
        transactionAmount: plaidTransaction.amount,
        transactionOriginalDescription: plaidTransaction.original_description,
      });

      const overrideEdit = uniqueCategoryChangeTransactionEdits.find(
        (edit) =>
          edit.oldTransactionDescription ===
          plaidTransaction.original_description
      );
      if (overrideEdit) {
        const overrideCategoryName = overrideEdit.newTransactionCategory;
        const overrideCategoryId = Object.keys(incomeCategoryIdToNameMap).find(
          (key) => incomeCategoryIdToNameMap[key] === overrideCategoryName
        );
        if (overrideCategoryId) {
          transactionCategory.category = overrideCategoryName;
          transactionCategory.categoryId = overrideCategoryId;
        }
      }
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
      plaidItemId: plaidItemId,
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
    uniqueCategoryChangeTransactionEdits,
    categoryIdToNameMap,
    plaidItemId
  ) {
    // Get transaction type edits, sorted by most recent first
    const transactionTypeEdits = plan.transactionEdits
      .filter((edit) => edit.oldTransactionType !== edit.newTransactionType)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // First, determine transaction type
    const transactionType = this._determineTransactionType(
      plaidTransactions,
      plaidTransaction,
      transactionTypeEdits
    );

    let transactionCategory;

    if (['spending', 'refund'].includes(transactionType)) {
      const spendingCategoryIdToNameMap = Object.fromEntries(
        Object.entries(categoryIdToNameMap).filter(([key, value]) =>
          value.startsWith('spending.')
        )
      );

      transactionCategory = await this.openaiAdapter.getTransactionCategory({
        categoryIdToNameMap: spendingCategoryIdToNameMap,
        transactionAmount: plaidTransaction.amount,
        transactionOriginalDescription: plaidTransaction.original_description,
      });

      const overrideEdit = uniqueCategoryChangeTransactionEdits.find(
        (edit) =>
          edit.oldTransactionDescription ===
          plaidTransaction.original_description
      );
      if (overrideEdit) {
        const overrideCategoryName = overrideEdit.newTransactionCategory;
        const overrideCategoryId = Object.keys(
          spendingCategoryIdToNameMap
        ).find(
          (key) => spendingCategoryIdToNameMap[key] === overrideCategoryName
        );
        if (overrideCategoryId) {
          transactionCategory.category = overrideCategoryName;
          transactionCategory.categoryId = overrideCategoryId;
        }
      }
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
        transactionAmount: plaidTransaction.amount,
        transactionOriginalDescription: plaidTransaction.original_description,
      });

      const overrideEdit = uniqueCategoryChangeTransactionEdits.find(
        (edit) =>
          edit.oldTransactionDescription ===
          plaidTransaction.original_description
      );
      if (overrideEdit) {
        const overrideCategoryName = overrideEdit.newTransactionCategory;
        const overrideCategoryId = Object.keys(incomeCategoryIdToNameMap).find(
          (key) => incomeCategoryIdToNameMap[key] === overrideCategoryName
        );
        if (overrideCategoryId) {
          transactionCategory.category = overrideCategoryName;
          transactionCategory.categoryId = overrideCategoryId;
        }
      }
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
      plaidItemId: plaidItemId,
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

  /**
   * Check if a plaid item has any transactions and send rolling notifications (5, 15, 30 days)
   * @private
   */
  async _checkAndNotifyStaleConnection(plaidItem, tenant) {
    const now = new Date();
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Find the most recent transaction for this plaid item
    let mostRecentTransactionDate = null;

    for (const plan of tenant.plans) {
      // Check plan-level transactions
      for (const transaction of plan.transactions) {
        if (transaction.plaidItemId === plaidItem.plaidItemId) {
          const transactionDate = new Date(transaction.date);
          if (
            !mostRecentTransactionDate ||
            transactionDate > mostRecentTransactionDate
          ) {
            mostRecentTransactionDate = transactionDate;
          }
        }
      }

      // Check category and subcategory transactions
      for (const category of plan.categories) {
        // Check category-level transactions
        for (const transaction of category.transactions) {
          if (transaction.plaidItemId === plaidItem.plaidItemId) {
            const transactionDate = new Date(transaction.date);
            if (
              !mostRecentTransactionDate ||
              transactionDate > mostRecentTransactionDate
            ) {
              mostRecentTransactionDate = transactionDate;
            }
          }
        }

        // Check subcategory transactions
        for (const subcategory of category.subcategories) {
          for (const transaction of subcategory.transactions) {
            if (transaction.plaidItemId === plaidItem.plaidItemId) {
              const transactionDate = new Date(transaction.date);
              if (
                !mostRecentTransactionDate ||
                transactionDate > mostRecentTransactionDate
              ) {
                mostRecentTransactionDate = transactionDate;
              }
            }
          }
        }
      }
    }

    // If we found recent transactions (within 5 days), reset notification tracking
    if (mostRecentTransactionDate && mostRecentTransactionDate >= fiveDaysAgo) {
      plaidItem.lastStaleNotificationLevel = null;
      plaidItem.lastStaleNotificationSentAt = null;
      return;
    }

    // Determine what level of notification to send
    let notificationLevel = null;
    let subject = '';
    let message = '';

    if (
      mostRecentTransactionDate &&
      mostRecentTransactionDate < thirtyDaysAgo
    ) {
      // 30+ days without transactions
      if (plaidItem.lastStaleNotificationLevel !== '30-day') {
        notificationLevel = '30-day';
        subject = 'Fincapy - Connection Issue: 30 Days Without Transactions';
        message = `We haven't detected any transactions from ${plaidItem.institutionName} in over 30 days. Your connection likely needs attention. Please refresh your connection on the Financial Institutions page.`;
      }
    } else if (
      mostRecentTransactionDate &&
      mostRecentTransactionDate < fifteenDaysAgo
    ) {
      // 15+ days without transactions
      if (
        plaidItem.lastStaleNotificationLevel !== '15-day' &&
        plaidItem.lastStaleNotificationLevel !== '30-day'
      ) {
        notificationLevel = '15-day';
        subject = 'Fincapy - No Transactions for 15 Days';
        message = `We haven't detected any new transactions from ${plaidItem.institutionName} in 15 days. This might indicate that your connection needs to be refreshed. Please check the Financial Institutions page.`;
      }
    } else if (
      !mostRecentTransactionDate ||
      mostRecentTransactionDate < fiveDaysAgo
    ) {
      // 5+ days without transactions (or no transactions found)
      if (!plaidItem.lastStaleNotificationLevel) {
        notificationLevel = '5-day';
        subject = 'Fincapy - No Recent Transactions Detected';
        message = `We haven't detected any new transactions from ${plaidItem.institutionName} in the past 5 days. This might indicate that your connection needs to be refreshed, or maybe you just haven't bought anything! If you're not sure, refresh your connection on the Financial Institutions page.`;
      }
    }

    // Send notification if we determined we should
    if (notificationLevel) {
      const primaryEmail = tenant.users.find((user) => user.role === 'owner')
        .emails[0].email;

      await this.sesAdapter.sendEmail({
        to: primaryEmail,
        subject: subject,
        text: message,
      });

      // Update notification tracking
      plaidItem.lastStaleNotificationLevel = notificationLevel;
      plaidItem.lastStaleNotificationSentAt = new Date();
    }
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
                );

            const batchSize = 5;
            const addedTransactions = plaidTransactions.added;

            for (let i = 0; i < addedTransactions.length; i += batchSize) {
              const batch = addedTransactions.slice(i, i + batchSize);
              await Promise.all(
                batch.map((plaidTransaction) =>
                  this.addTransaction(
                    plaidTransactions,
                    plaidTransaction,
                    plan,
                    uniqueCategoryChangeTransactionEdits,
                    categoryIdToNameMap,
                    plaidItem.plaidItemId
                  )
                )
              );
            }

            for (const plaidTransaction of plaidTransactions.modified) {
              await this.updateTransaction(
                plaidTransactions,
                plaidTransaction,
                plan,
                uniqueCategoryChangeTransactionEdits,
                categoryIdToNameMap,
                plaidItem.plaidItemId
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

        // Check if no transactions have been ingested for 5 days
        await this._checkAndNotifyStaleConnection(plaidItem, tenant);
      }
      await tenantRepository.set({ tenantId, tenant });
      return true;
    });
  }
}

export { IngestTransactionUpdatesService };
