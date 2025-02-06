class User {
  constructor({ id, tenantId, emails, name, role, password }) {
    this.id = id;
    this.tenantId = tenantId;
    this.emails = emails;
    this.name = name;
    this.role = role;
    this.password = password;
  }
}

export { User };
