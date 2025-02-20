class ChangeUserRoleService {
  constructor({ transactionManager }) {
    this.transactionManager = transactionManager;
  }

  async execute({ tenantId, userId, role }) {
    await this.transactionManager.transaction(
      async ({ tenantRepository, userRepository }) => {
        const tenant = await tenantRepository.get({ tenantId });
        const user = await userRepository.get({ userId });
        if (tenant === null) {
          return;
        }
        if (user === null) {
          return;
        }
        const tenantUser = tenant.users.find((user) => user.id === userId);
        tenantUser.role = role;
        user.role = role;
        await userRepository.set({ userId, user });
        await tenantRepository.set({ tenantId, tenant });
      }
    );
  }
}

export { ChangeUserRoleService };
