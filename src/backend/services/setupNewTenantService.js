import { Category } from '../domain/category';
import { Plan } from '../domain/plan';

class SetupNewTenantService {
  constructor({ planRepository }) {
    this.planRepository = planRepository;
  }

  async execute({ tenantId }) {
    try {
      let plan = await this.planRepository.get({ tenantId });
      if (plan) {
        return;
      }
      plan = new Plan({
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
      await this.planRepository.put({ tenantId, planId: 'initial', plan });
    } catch (error) {
      console.log(error);
    }
  }
}

export { SetupNewTenantService };
