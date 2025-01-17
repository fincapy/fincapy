import { User } from '../domain/user';

class CreateUserService {
  constructor({ tenantRepository, auth0Adapter }) {
    this.tenantRepository = tenantRepository;
    this.auth0Adapter = auth0Adapter;
  }

  async execute({ tenantId, email, name, role }) {
    const tenant = await this.tenantRepository.getWithTransaction({ tenantId });
    let auth0User = await this.auth0Adapter.getUserByEmail(email);
    if (auth0User) {
      throw new Error('User already exists');
    }
    await this.auth0Adapter.createUser(email, name);
    auth0User = await this.auth0Adapter.getUserByEmail(email);
    await this.auth0Adapter.updateUserAppMetadata(auth0User.user_id, {
      role: role,
      tenant_id: tenantId,
    });
    tenant.users.push(new User({ email, role, name }));
    await this.tenantRepository.set({ tenantId, tenant });
  }
}

export { CreateUserService };
