class ChangeUserNameService {
  constructor({ transactionManager }) {
    this.transactionManager = transactionManager;
  }

  async execute({ tenantId, email, name }) {
    await this.transactionManager.transaction(async ({ tenantRepository }) => {
      const tenant = await tenantRepository.get({
        tenantId,
      });
      const user = tenant.users.find((user) => user.email === email);
      user.name = name;
      await tenantRepository.set({ tenantId, tenant });
    });
  }
}

export { ChangeUserNameService };
