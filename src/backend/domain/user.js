import { totp } from 'speakeasy';

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
    totpEnabled,
    backupCodes,
    categoryColors = {},
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
    this.totpEnabled = totpEnabled;
    this.totpSecret = totpSecret;
    this.backupCodes = backupCodes;
    this.categoryColors = categoryColors;
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
      totpEnabled: this.totpEnabled,
      categoryColors: this.categoryColors,
    };
  }
}

export { User };
