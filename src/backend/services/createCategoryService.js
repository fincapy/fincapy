import { Category } from '@/backend/domain/category';

class CreateCategoryService {
  constructor({ transactionManager }) {
    this.transactionManager = transactionManager;
  }

  async execute({
    tenantId,
    userId,
    planId,
    color,
    categoryId,
    otherSubcategoryId,
    name,
    monthlyGoal,
    type,
    isImmutable,
    icon,
  }) {
    await this.transactionManager.transaction(
      async ({ tenantRepository, userRepository }) => {
        const tenant = await tenantRepository.get({ tenantId });
        const user = await userRepository.get({ userId });
        if (tenant === null) {
          return;
        }
        const plan = tenant.plans.find((plan) => plan.planId === planId);
        plan.addCategory({
          categoryId,
          otherSubcategoryId,
          name,
          monthlyGoal,
          type,
          isImmutable,
          icon,
        });
        const tenantUser = tenant.users.find((user) => user.id === userId);
        tenantUser.categoryColors = {
          [categoryId]: color,
        };
        await tenantRepository.set({ tenantId, tenant });
        user.categoryColors[categoryId] = color;
        await userRepository.set({ userId, user });
      }
    );
  }
}

export { CreateCategoryService };
