class ChangeUserRoleService {
  constructor({ tenantRepository }) {
    this.tenantRepository = tenantRepository;
  }

  async execute({ tenantId, email, role }) {
    const [tenant, etag] = await this.tenantRepository.get({ tenantId });
    const user = tenant.users.find((user) => user.email === email);
    user.role = role;
    await this.tenantRepository.put({ tenantId, tenant, etag });
  }
}

export { ChangeUserRoleService };
