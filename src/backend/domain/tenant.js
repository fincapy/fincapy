class Tenant {
  constructor({ tenantId, plaidAccessToken, createdAt, updatedAt }) {
    this.tenantId = tenantId;
    this.plaidAccessToken = plaidAccessToken;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

export default Tenant;
