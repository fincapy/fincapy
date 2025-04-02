class PlaidItem {
  constructor({
    userId,
    plaidItemId,
    institutionId,
    institutionName,
    accessToken,
    cursor,
    status,
    lastIngestedAt,
  }) {
    this.userId = userId;
    this.plaidItemId = plaidItemId;
    this.institutionId = institutionId;
    this.institutionName = institutionName;
    this.accessToken = accessToken;
    this.cursor = cursor;
    this.status = status;
    this.lastIngestedAt = lastIngestedAt;
  }
}

export { PlaidItem };
