import { User } from '../domain/user';

class CreateUserService {
  constructor({ transactionManager, auth0Adapter }) {
    this.transactionManager = transactionManager;
    this.auth0Adapter = auth0Adapter;
  }

  async execute({ tenantId, email, name, role, userId }) {
    await this.transactionManager.transaction(
      async ({ tenantRepository, userRepository }) => {
        const tenant = await tenantRepository.get({
          tenantId,
        });
        const existingUser = await userRepository.getByEmail({ email });
        if (existingUser) {
          throw new Error('User already exists');
        }
        const newUser = new User({
          id: userId,
          tenantId,
          name,
          emails: [{ email, verified: false, primary: true }],
          role: role,
          password: null,
          mfaMethod: 'email',
          totpSecret: null,
          totpVerified: false,
        });
        tenant.users.push(newUser);
        await userRepository.set({ userId: newUser.id, user: newUser });
        await tenantRepository.set({ tenantId, tenant });
      }
    );
  }
}

export { CreateUserService };
