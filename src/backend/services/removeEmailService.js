import { User } from '../domain/user';

class RemoveEmailService {
  constructor({ transactionManager }) {
    this.transactionManager = transactionManager;
  }

  async execute({ userId, email }) {
    return await this.transactionManager.transaction(
      async ({ userRepository, tenantRepository }) => {
        // Get current user
        const user = await userRepository.get({ userId });
        if (!user) {
          throw new Error('User not found');
        }

        // Check if email exists for this user
        const emailEntry = user.emails.find((e) => e.email === email);
        if (!emailEntry) {
          throw new Error('Email address not found on this account');
        }

        // Check if email is primary
        if (emailEntry.primary) {
          throw new Error('Cannot remove primary email address');
        }

        // Ensure user has at least one email after removal
        if (user.emails.length <= 1) {
          throw new Error('User must have at least one email address');
        }

        // Remove the email
        user.emails = user.emails.filter((e) => e.email !== email);

        // Save the updated user
        await userRepository.set({ userId: user.id, user });

        // Remove email lookup
        await userRepository.deleteEmailLookup({ email });

        // Update tenant with the updated user emails
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

export { RemoveEmailService };
