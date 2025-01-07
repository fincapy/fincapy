class Tenant {
  constructor({
    tenantId,
    plans,
    plaidItems,
    outbox,
    inbox,
    billingStatus,
    users,
  }) {
    this.tenantId = tenantId;
    this.plans = plans;
    this.plaidItems = plaidItems;
    this.outbox = outbox;
    this.inbox = inbox;
    this.billingStatus = billingStatus;
    this.users = users;
  }
}

export { Tenant };
