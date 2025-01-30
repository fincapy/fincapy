import { Category } from '../domain/category';
import { Plan } from '../domain/plan';
import { Tenant } from '../domain/tenant';
import { User } from '../domain/user';

class SetupNewTenantService {
  constructor({ tenantRepository }) {
    this.tenantRepository = tenantRepository;
  }

  async execute({ tenantId, email, name, whitelistBilling }) {
    let existingTenant = await this.tenantRepository.get({ tenantId });
    if (existingTenant) {
      return;
    }
    const tenant = new Tenant({
      tenantId,
      plans: [],
      plaidItems: [],
      outbox: [],
      inbox: [],
      billingStatus: whitelistBilling ? 'active' : 'unpaid',
      users: [
        new User({
          email,
          name,
          role: 'owner',
        }),
      ],
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
      categoryId: '1',
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
      categoryId: '2',
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
      categoryId: '3',
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
  }
}

export { SetupNewTenantService };
