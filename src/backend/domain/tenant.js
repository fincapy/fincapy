class Tenant {
  constructor({ tenantId, plans, plaidItems, outbox, inbox }) {
    this.tenantId = tenantId;
    this.plans = plans;
    this.plaidItems = plaidItems;
    this.outbox = outbox;
    this.inbox = inbox;
  }
}

export { Tenant };
