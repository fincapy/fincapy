class RemoveUserService {
  constructor({ tenantRepository, auth0Adapter }) {
    this.tenantRepository = tenantRepository;
    this.auth0Adapter = auth0Adapter;
  }

  async execute({ tenantId, email }) {
    const response = await this.tenantRepository.get({ tenantId });
    if (response === null) {
      return;
    }
    const [tenant, etag] = response;
    const user = tenant.users.find((user) => user.email === email);
    if (user) {
      tenant.users = tenant.users.filter((user) => user.email !== email);
      const auth0User = await this.auth0Adapter.getUserByEmail(email);
      await this.auth0Adapter.deleteUser(auth0User.user_id);
      await this.tenantRepository.update({ tenantId, tenant, etag });
    }
  }
}
