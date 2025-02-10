import { Category } from '../domain/category';
import { Plan } from '../domain/plan';
import { Tenant } from '../domain/tenant';
import { User } from '../domain/user';
import bcrypt from 'bcryptjs';

class SetupNewTenantService {
  constructor({ transactionManager, tenantRepository, userRepository }) {
    this.transactionManager = transactionManager;
    this.tenantRepository = tenantRepository;
    this.userRepository = userRepository;
  }

  async execute({ userId, tenantId, email, name, password, whitelistBilling }) {
    await this.transactionManager.transaction(
      { tenantId, userEmail: email },
      async ({ existingTenant, existingUser }) => {
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
          emails: [{ email, verified: false, primary: true }],
          role: 'owner',
          password: null,
          mfaMethod: 'email',
          totpSecret: null,
          totpVerified: false,
        });
        const hashedPassword = await bcrypt.hash(password, 12);
        user.password = hashedPassword;
        const tenant = new Tenant({
          tenantId,
          plans: [],
          plaidItems: [],
          outbox: [],
          inbox: [],
          billingStatus: whitelistBilling ? 'active' : 'unpaid',
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
          categoryId: 'uncategorizedSpending',
          name: 'Uncategorized',
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
          categoryId: 'uncategorizedIncome',
          name: 'Uncategorized',
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
          categoryId: 'uncategorizedSavings',
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
        await this.tenantRepository.set({ tenantId, tenant });
        await this.userRepository.setEmailLookup({ email, userId });
        await this.userRepository.set({ userId: user.id, user });
      }
    );
  }
}

export { SetupNewTenantService };
