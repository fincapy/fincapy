class Session {
  constructor({
    sessionId,
    userId,
    userRole,
    tenantId,
    createdAt,
    lastRotated,
  }) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.userRole = userRole;
    this.tenantId = tenantId;
    this.createdAt = createdAt;
    this.lastRotated = lastRotated;
  }
}
export { Session };
