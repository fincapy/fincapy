class PlaidItem {
  constructor({ institutionId, institutionName, accessToken, cursor, status }) {
    this.institutionId = institutionId;
    this.institutionName = institutionName;
    this.accessToken = accessToken;
    this.cursor = cursor;
    this.status = status;
  }
}

export { PlaidItem };
