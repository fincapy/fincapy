class Tenant {
  constructor({ tenantId, plans, plaidItems, outbox, inbox, billingStatus }) {
    this.tenantId = tenantId;
    this.plans = plans;
    this.plaidItems = plaidItems;
    this.outbox = outbox;
    this.inbox = inbox;
    this.billingStatus = billingStatus;
  }
}

export { Tenant };
