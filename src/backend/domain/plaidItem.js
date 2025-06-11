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
    lastStaleNotificationLevel = null,
    lastStaleNotificationSentAt = null,
  }) {
    this.userId = userId;
    this.plaidItemId = plaidItemId;
    this.institutionId = institutionId;
    this.institutionName = institutionName;
    this.accessToken = accessToken;
    this.cursor = cursor;
    this.status = status;
    this.lastIngestedAt = lastIngestedAt;
    this.lastStaleNotificationLevel = lastStaleNotificationLevel;
    this.lastStaleNotificationSentAt = lastStaleNotificationSentAt;
  }
}

export { PlaidItem };
