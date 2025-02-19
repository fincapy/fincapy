class RemoveUserService {
  constructor({ transactionManager, auth0Adapter }) {
    this.transactionManager = transactionManager;
    this.auth0Adapter = auth0Adapter;
  }

  async execute({ tenantId, userId }) {
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
        tenant.users = tenant.users.filter((user) => user.id !== userId);
        await userRepository.delete({ userId });
        await tenantRepository.set({ tenantId, tenant });
      }
    );
  }
}

export { RemoveUserService };
