import {
  TransactionCreatedMessage,
  TransactionUpdatedMessage,
  TransactionDeletedMessage,
} from '../adapters/messages';

class IngestNewTransactionsService {
  constructor({
    plaidAdapter,
    plaidItemRepository,
    pubsubAdapter,
    planRepository,
  }) {
    this.plaidAdapter = plaidAdapter;
    this.plaidItemRepository = plaidItemRepository;
    this.planRepository = planRepository;
    this.pubsubAdapter = pubsubAdapter;
  }

  async execute({ tenantId, institutionId }) {
    const plaidItem = await this.plaidItemRepository.get({
      tenantId,
      institutionId,
    });
    if (!plaidItem) {
      return null;
    }

    try {
      await this.plaidAdapter.refreshTransactions({
        accessToken: plaidItem.accessToken,
      });
    } catch (error) {}

    const transactions = await this.plaidAdapter.getTransactions({
      accessToken: plaidItem.accessToken,
      cursor: plaidItem.cursor,
    });
    const plan = await this.planRepository.get({ tenantId });
    const categoryIdToNameMap = {};
    plan.categories.forEach((category) => {
      categoryIdToNameMap[category.categoryId] = category.name;
    });
    plan.categories.forEach((category) => {
      category.subcategories.forEach((subcategory) => {
        categoryIdToNameMap[subcategory.subcategoryId] = subcategory.name;
      });
    });

    return true;
  }
}

export { IngestNewTransactionsService };
