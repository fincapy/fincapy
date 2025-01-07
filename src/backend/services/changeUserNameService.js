class ChangeUserNameService {
  constructor({ tenantRepository }) {
    this.tenantRepository = tenantRepository;
  }

  async execute({ tenantId, email, name }) {
    const [tenant, etag] = await this.tenantRepository.get({ tenantId });
    const user = tenant.users.find((user) => user.email === email);
    user.name = name;
    await this.tenantRepository.put({ tenantId, tenant, etag });
  }
}

export { ChangeUserNameService };
