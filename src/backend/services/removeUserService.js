class RemoveUserService {
  constructor({ transactionManager, auth0Adapter }) {
    this.transactionManager = transactionManager;
    this.auth0Adapter = auth0Adapter;
  }

  async execute({ tenantId, email }) {
    await this.transactionManager.transaction(async ({ tenantRepository }) => {
      const tenant = await tenantRepository.get({ tenantId });
      if (tenant === null) {
        return;
      }
      const user = tenant.users.find((user) => user.email === email);
      if (user) {
        tenant.users = tenant.users.filter((user) => user.email !== email);
        const auth0User = await this.auth0Adapter.getUserByEmail(email);
        await this.auth0Adapter.deleteUser(auth0User.user_id);
        await tenantRepository.set({ tenantId, tenant });
      }
    });
  }
}

export { RemoveUserService };
