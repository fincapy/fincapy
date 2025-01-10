class FinancialInstitutionsView {
  constructor({ tenantRepository }) {
    this.tenantRepository = tenantRepository;
  }

  async get({ tenantId }) {
    const [tenant, etag] = await this.tenantRepository.get({ tenantId });
    return tenant.plaidItems.map((plaidItem) => {
      return {
        institutionId: plaidItem.institutionId,
        institutionName: plaidItem.institutionName,
      };
    });
  }
}

export { FinancialInstitutionsView };
