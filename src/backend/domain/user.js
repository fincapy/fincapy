class User {
  constructor({ id, tenantId, emails, name, role, password, mfaMethod }) {
    this.id = id;
    this.tenantId = tenantId;
    this.emails = emails;
    this.name = name;
    this.role = role;
    this.password = password;
    this.mfaMethod = mfaMethod;
    this.totpSecret = null;
  }

  toView() {
    return {
      id: this.id,
      emails: this.emails.map((email) => {
        return {
          email: email.email,
          verified: email.verified,
          primary: email.primary,
        };
      }),
      name: this.name,
      role: this.role,
      mfaMethod: this.mfa_method,
    };
  }
}

export { User };
