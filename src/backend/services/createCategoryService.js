import { Category } from '@/backend/domain/category';

class CreateCategoryService {
  constructor({ tenantRepository }) {
    this.tenantRepository = tenantRepository;
  }

  async execute({
    tenantId,
    planId,
    categoryId,
    name,
    monthlyGoal,
    type,
    isImmutable,
  }) {
    const tenant = await this.tenantRepository.getWithTransaction({ tenantId });
    if (tenant === null) {
      return;
    }
    const plan = tenant.plans.find((plan) => plan.planId === planId);
    plan.addCategory({ categoryId, name, monthlyGoal, type, isImmutable });
    await this.tenantRepository.set({ tenantId, tenant });
  }
}

export { CreateCategoryService };
