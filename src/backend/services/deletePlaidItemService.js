class DeletePlaidItemService {
  constructor({ transactionManager, plaidAdapter }) {
    this.transactionManager = transactionManager;
    this.plaidAdapter = plaidAdapter;
  }

  async execute({ tenantId, plaidItemId }) {
    console.log('plaidItemId', plaidItemId);
    await this.transactionManager.transaction(async ({ tenantRepository }) => {
      const tenant = await tenantRepository.get({
        tenantId,
      });
      const plaidItem = tenant.plaidItems.find(
        (item) => item.plaidItemId === plaidItemId
      );
      await this.plaidAdapter.deleteItem({
        accessToken: plaidItem.accessToken,
      });
      tenant.plaidItems = tenant.plaidItems.filter(
        (item) => item.plaidItemId !== plaidItemId
      );
      await tenantRepository.set({ tenantId, tenant });
    });
  }
}

export { DeletePlaidItemService };
