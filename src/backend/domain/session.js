class Session {
  constructor({ sessionId, userId, tenantId, createdAt, lastRotated }) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.tenantId = tenantId;
    this.createdAt = createdAt;
    this.lastRotated = lastRotated;
  }
}
export { Session };
