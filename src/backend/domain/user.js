class User {
  constructor({
    id,
    tenantId,
    emails,
    name,
    role,
    password,
    mfaMethod,
    emailVerified,
    totpSecret,
    totpVerified,
  }) {
    this.id = id;
    this.tenantId = tenantId;
    this.emails = emails;
    this.name = name;
    this.role = role;
    this.password = password;
    this.mfaMethod = mfaMethod;
    this.totpSecret = null;
    this.emailVerified = emailVerified;
    this.totpVerified = totpVerified;
    this.totpSecret = totpSecret;
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
