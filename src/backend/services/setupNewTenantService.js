import { Category } from '../domain/category';
import { Plan } from '../domain/plan';
import { Tenant } from '../domain/tenant';
import { User } from '../domain/user';

class SetupNewTenantService {
  constructor({ tenantRepository }) {
    this.tenantRepository = tenantRepository;
  }

  async execute({ tenantId, userId, email, name }) {
    try {
      let response = await this.tenantRepository.get({ tenantId });
      if (response) {
        return;
      }
      const tenant = new Tenant({
        tenantId,
        plans: [],
        plaidItems: [],
        outbox: [],
        inbox: [],
        billingStatus: 'unpaid',
        users: [
          new User({
            email,
            name,
            role: 'owner',
            status: 'active',
          }),
        ],
      });
      const plan = new Plan({
        planId: 'initial',
        categories: [],
        recategorizations: [],
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
      });
      plan.categories.push(spendingCategory);
      tenant.plans.push(plan);
      await this.tenantRepository.put({ tenantId, tenant, etag: null });
    } catch (error) {
      console.log(error);
    }
  }
}

export { SetupNewTenantService };
