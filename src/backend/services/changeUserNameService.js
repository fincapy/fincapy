class ChangeUserNameService {
  constructor({ transactionManager }) {
    this.transactionManager = transactionManager;
  }

  async execute({ tenantId, userId, name }) {
    await this.transactionManager.transaction(
      async ({ tenantRepository, userRepository }) => {
        const tenant = await tenantRepository.get({
          tenantId,
        });
        const user = await userRepository.get({ userId });
        if (tenant === null) {
          return;
        }
        if (user === null) {
          return;
        }
        const tenantUser = tenant.users.find((user) => user.id === userId);
        tenantUser.name = name;
        user.name = name;
        await userRepository.set({ userId, user });
        await tenantRepository.set({ tenantId, tenant });
      }
    );
  }
}

export { ChangeUserNameService };
