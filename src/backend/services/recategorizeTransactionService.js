import { Recategorization } from '../domain/recategorization';

class RecategorizeTransactionService {
  constructor({
    transactionRepositoryFactory,
    recategorizeLogRepositoryFactory,
    db,
  }) {
    this.transactionRepositoryFactory = transactionRepositoryFactory;
    this.recategorizeLogRepositoryFactory = recategorizeLogRepositoryFactory;
    this.db = db;
  }

  async execute({ tenantId, transactionId, categoryId }) {
    await this.db.transaction(async (tx) => {
      const transactionRepository = new this.transactionRepositoryFactory({
        tx,
      });
      const recategorizationLogRepository =
        new this.recategorizeLogRepositoryFactory({ tx });

      const transaction = await transactionRepository.get({
        tenantId,
        transactionId,
      });
      const recategorization = new Recategorization({
        tenantId,
        recategorizationId: crypto.randomUUID(),
        transactionId,
        oldCategoryId: transaction.categoryId,
        newCategoryId: categoryId,
        createdAt: new Date(),
      });
      transaction.categoryId = categoryId;

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      await recategorizationLogRepository.add(recategorization);
      await transactionRepository.update(transaction);
    });
  }
}

export { RecategorizeTransactionService };
