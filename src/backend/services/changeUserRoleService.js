class ChangeUserRoleService {
  constructor({ transactionManager }) {
    this.transactionManager = transactionManager;
  }

  async execute({ tenantId, email, role }) {
    await this.transactionManager.transaction(async ({ tenantRepository }) => {
      const tenant = await tenantRepository.get({ tenantId });
      const user = tenant.users.find((user) => user.email === email);
      user.role = role;
      await tenantRepository.set({ tenantId, tenant });
    });
  }
}

export { ChangeUserRoleService };
