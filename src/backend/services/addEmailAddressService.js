import { User } from '../domain/user';

class AddEmailAddressService {
  constructor({ transactionManager }) {
    this.transactionManager = transactionManager;
  }

  async execute({ userId, email, isPrimary = false }) {
    return await this.transactionManager.transaction(
      async ({ userRepository, tenantRepository }) => {
        // Check if email already exists in the system
        const existingUser = await userRepository.getByEmail({ email });
        if (existingUser) {
          throw new Error('Email address already in use');
        }

        // Get current user
        const user = await userRepository.get({ userId });
        if (!user) {
          throw new Error('User not found');
        }

        // Check if email already exists for this user
        const emailExists = user.emails.some((e) => e.email === email);
        if (emailExists) {
          throw new Error('Email address already added to this account');
        }

        // Add the new email
        user.emails.push({
          email,
          verified: false,
          primary: isPrimary,
        });

        // Save the updated user
        await userRepository.set({ userId: user.id, user });

        // Create email lookup
        await userRepository.setEmailLookup({ email, userId });

        // Update tenant with the new user email
        const tenantId = user.tenantId;
        const tenant = await tenantRepository.get({ tenantId });
        if (tenant) {
          const tenantUser = tenant.users.find((u) => u.id === userId);
          if (tenantUser) {
            tenantUser.emails = user.emails;
            await tenantRepository.set({ tenantId, tenant });
          }
        }

        return user;
      }
    );
  }
}

export { AddEmailAddressService };
