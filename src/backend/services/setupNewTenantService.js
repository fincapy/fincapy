import { Category } from '../domain/category';
import { Plan } from '../domain/plan';
import { Tenant } from '../domain/tenant';

class SetupNewTenantService {
  constructor({ tenantRepository }) {
    this.tenantRepository = tenantRepository;
  }

  async execute({ tenantId }) {
    try {
      let tenant = await this.tenantRepository.get({ tenantId });
      if (tenant) {
        return;
      }
      tenant = new Tenant({
        tenantId,
        plans: [],
        plaidItems: [],
      });
      const plan = new Plan({
        planId: 'initial',
        categories: [],
      });
      const spendingCategory = new Category({
        tenantId,
        categoryId: '1',
        name: 'Spending',
        type: 'spending',
        monthlyGoal: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        isImmutable: false,
        transactions: [],
        subcategories: [],
      });
      plan.categories.push(spendingCategory);
      tenant.plans.push(plan);
      await this.tenantRepository.put({ tenantId, tenant });
    } catch (error) {
      console.log(error);
    }
  }
}

export { SetupNewTenantService };
