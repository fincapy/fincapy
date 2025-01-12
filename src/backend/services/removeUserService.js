class RemoveUserService {
  constructor({ tenantRepository, auth0Adapter }) {
    this.tenantRepository = tenantRepository;
    this.auth0Adapter = auth0Adapter;
  }

  async execute({ tenantId, email }) {
    const tenant = await this.tenantRepository.getWithTransaction({ tenantId });
    if (tenant === null) {
      return;
    }
    const user = tenant.users.find((user) => user.email === email);
    if (user) {
      tenant.users = tenant.users.filter((user) => user.email !== email);
      const auth0User = await this.auth0Adapter.getUserByEmail(email);
      await this.auth0Adapter.deleteUser(auth0User.user_id);
      await this.tenantRepository.set({ tenantId, tenant });
    }
  }
}

export { RemoveUserService };
