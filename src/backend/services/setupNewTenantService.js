import { Category } from '../domain/category';
import { Plan } from '../domain/plan';
import { Tenant } from '../domain/tenant';
import { User } from '../domain/user';
import bcrypt from 'bcryptjs';

class SetupNewTenantService {
  constructor({ transactionManager }) {
    this.transactionManager = transactionManager;
  }

  async execute({
    userId,
    tenantId,
    email,
    name,
    password,
    whitelistBilling,
    emailVerified = false,
    authProvider = 'email',
  }) {
    await this.transactionManager.transaction(
      async ({ userRepository, tenantRepository }) => {
        const existingUser = await userRepository.getByEmail({ email });
        const existingTenant = await tenantRepository.get({ tenantId });
        if (existingTenant) {
          throw new Error('Tenant already exists');
        }
        if (existingUser) {
          throw new Error('User already exists');
        }
        const user = new User({
          id: userId,
          tenantId,
          name,
          emails: [{ email, verified: emailVerified, primary: true }],
          role: 'owner',
          password: null,
          mfaMethod: 'email',
          totpEnabled: false,
          totpSecret: null,
          totpVerified: false,
          authProvider,
        });
        const hashedPassword = await bcrypt.hash(password, 12);
        user.password = hashedPassword;
        const tenant = new Tenant({
          tenantId,
          plans: [],
          plaidItems: [],
          outbox: [],
          inbox: [],
          billingStatus: 'free',
          users: [user],
          failedBillingAttempts: 0,
        });
        const plan = new Plan({
          planId: 'initial',
          categories: [],
          transactionEdits: [],
          startDate: null,
          endDate: null,
        });
        const spendingCategory = new Category({
          tenantId,
          categoryId: 'spending_other',
          name: 'Other',
          type: 'spending',
          monthlyGoal: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          isImmutable: true,
          transactions: [],
          subcategories: [],
          rank: 0,
        });
        const incomeCategory = new Category({
          tenantId,
          categoryId: 'income_other',
          name: 'Other',
          type: 'income',
          monthlyGoal: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          isImmutable: true,
          transactions: [],
          subcategories: [],
          rank: 0,
        });
        const savingsCategory = new Category({
          tenantId,
          categoryId: 'savings_other',
          name: 'Savings',
          type: 'savings',
          monthlyGoal: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          isImmutable: true,
          transactions: [],
          subcategories: [],
          rank: 0,
        });
        plan.categories.push(spendingCategory);
        plan.categories.push(incomeCategory);
        plan.categories.push(savingsCategory);
        tenant.plans.push(plan);
        await tenantRepository.set({ tenantId, tenant });
        await tenantRepository.incrementVersion({ tenantId });
        await userRepository.setEmailLookup({ email, userId });
        await userRepository.set({ userId: user.id, user });
        await userRepository.incrementVersion({ userId: user.id });
      }
    );
  }
}

export { SetupNewTenantService };
