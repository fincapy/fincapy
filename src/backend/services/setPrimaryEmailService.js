import { User } from '../domain/user';

class SetPrimaryEmailService {
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

        // Check if email is verified
        if (!emailEntry.verified) {
          throw new Error(
            'Email address must be verified before setting as primary'
          );
        }

        // If the email is already primary, no need to update
        if (emailEntry.primary) {
          return user;
        }

        // Update all emails to set the specified one as primary
        user.emails = user.emails.map((e) => ({
          ...e,
          primary: e.email === email,
        }));

        // Save the updated user
        await userRepository.set({ userId: user.id, user });
        await userRepository.incrementVersion({ userId: user.id });

        // Update tenant with the updated user emails
        const tenantId = user.tenantId;
        const tenant = await tenantRepository.get({ tenantId });
        if (tenant) {
          const tenantUser = tenant.users.find((u) => u.id === userId);
          if (tenantUser) {
            tenantUser.emails = user.emails;
            await tenantRepository.set({ tenantId, tenant });
            await tenantRepository.incrementVersion({ tenantId });
          }
        }

        return user;
      }
    );
  }
}

export { SetPrimaryEmailService };
