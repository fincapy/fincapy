class User {
  constructor({ id, tenantId, emails, name, role, password, mfa_method }) {
    this.id = id;
    this.tenantId = tenantId;
    this.emails = emails;
    this.name = name;
    this.role = role;
    this.password = password;
    this.mfa_method = mfa_method;
    this.totp_secret = null;
  }
}

export { User };
