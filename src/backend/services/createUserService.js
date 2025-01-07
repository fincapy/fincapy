import { User } from '../domain/user';

class CreateUserService {
  constructor({ tenantRepository, auth0Adapter }) {
    this.tenantRepository = tenantRepository;
    this.auth0Adapter = auth0Adapter;
  }

  async execute({ tenantId, email, name, role }) {
    const [tenant, etag] = await this.tenantRepository.get({ tenantId });
    await this.auth0Adapter.createUser(email, name);
    const auth0User = await this.auth0Adapter.getUserByEmail(email);
    await this.auth0Adapter.updateUserAppMetadata(auth0User.user_id, {
      role: role,
      tenant_id: tenantId,
    });
    await this.auth0Adapter.triggerPasswordChange(auth0User.user_id);
    tenant.users.push(new User({ email, role, name, status: 'pending' }));
    await this.tenantRepository.put({ tenantId, tenant, etag });
  }
}

export { CreateUserService };
