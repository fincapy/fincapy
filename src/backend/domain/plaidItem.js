class PlaidItem {
  constructor({
    institutionId,
    institutionName,
    tenantId,
    accessToken,
    cursor,
  }) {
    this.institutionId = institutionId;
    this.institutionName = institutionName;
    this.tenantId = tenantId;
    this.accessToken = accessToken;
    this.cursor = cursor;
  }
}

export { PlaidItem };
