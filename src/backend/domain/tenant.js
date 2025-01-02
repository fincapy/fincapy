class Tenant {
  constructor({ tenantId, plans, plaidItems }) {
    this.tenantId = tenantId;
    this.plans = plans;
    this.plaidItems = plaidItems;
  }
}

export { Tenant };
