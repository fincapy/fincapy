import { User } from '../domain/user';
import { UserCreatedMessage } from '../adapters/messages';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

function generateSecurePassword(length = 16) {
  return crypto
    .randomBytes(length)
    .toString('base64') // Can use 'hex' for simplicity
    .slice(0, length); // Ensure it’s the desired length
}

class CreateUserService {
  constructor({ transactionManager, auth0Adapter }) {
    this.transactionManager = transactionManager;
    this.auth0Adapter = auth0Adapter;
  }

  async execute({ tenantId, email, name, role, userId }) {
    await this.transactionManager.transaction(
      async ({ tenantRepository, userRepository, messageRepository }) => {
        const tenant = await tenantRepository.get({
          tenantId,
        });
        const accountOwner = tenant.users.find((user) => user.role === 'owner');
        const accountOwnerName = accountOwner.name;
        const existingUser = await userRepository.get({ userId });
        if (existingUser) {
          throw new Error('User already exists');
        }
        const randomPassword = generateSecurePassword();
        const hashedPassword = await bcrypt.hash(randomPassword, 12);
        const newUser = new User({
          id: userId,
          tenantId,
          name,
          emails: [{ email, verified: false, primary: true }],
          role: role,
          password: hashedPassword,
          mfaMethod: 'email',
          totpSecret: null,
          totpVerified: false,
        });
        tenant.users.push(newUser);
        await userRepository.set({ userId: newUser.id, user: newUser });
        await userRepository.incrementVersion({ userId: newUser.id });
        await tenantRepository.set({ tenantId, tenant });
        const userCreatedMessage = new UserCreatedMessage({
          topicName: 'user-created',
          inviterName: accountOwnerName,
          userId,
          email,
        });
        await messageRepository.add({
          message: userCreatedMessage,
          messageType: 'USER_CREATED',
        });
      }
    );
  }
}

export { CreateUserService };
