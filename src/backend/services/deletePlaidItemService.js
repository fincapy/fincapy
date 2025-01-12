class DeletePlaidItemService {
  constructor({ tenantRepository, plaidAdapter }) {
    this.tenantRepository = tenantRepository;
    this.plaidAdapter = plaidAdapter;
  }

  async execute({ tenantId, institutionId }) {
    const tenant = await this.tenantRepository.getWithTransaction({ tenantId });
    const plaidItem = tenant.plaidItems.find(
      (item) => item.institutionId === institutionId
    );
    await this.plaidAdapter.deleteItem({
      accessToken: plaidItem.accessToken,
    });
    tenant.plaidItems = tenant.plaidItems.filter(
      (item) => item.institutionId !== institutionId
    );
    await this.tenantRepository.set({ tenantId, tenant });
  }
}

export { DeletePlaidItemService };
