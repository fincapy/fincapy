class ChangeUserRoleService {
  constructor({ tenantRepository }) {
    this.tenantRepository = tenantRepository;
  }

  async execute({ tenantId, email, role }) {
    const tenant = await this.tenantRepository.getWithTransaction({ tenantId });
    const user = tenant.users.find((user) => user.email === email);
    user.role = role;
    await this.tenantRepository.set({ tenantId, tenant });
  }
}

export { ChangeUserRoleService };
