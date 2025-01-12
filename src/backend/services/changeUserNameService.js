class ChangeUserNameService {
  constructor({ tenantRepository }) {
    this.tenantRepository = tenantRepository;
  }

  async execute({ tenantId, email, name }) {
    const tenant = await this.tenantRepository.getWithTransaction({ tenantId });
    const user = tenant.users.find((user) => user.email === email);
    user.name = name;
    await this.tenantRepository.set({ tenantId, tenant });
  }
}

export { ChangeUserNameService };
