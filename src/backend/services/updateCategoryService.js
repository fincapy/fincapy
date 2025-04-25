class UpdateCategoryService {
  constructor({ transactionManager }) {
    this.transactionManager = transactionManager;
  }

  async execute({
    tenantId,
    userId,
    categoryId,
    planId,
    name,
    monthlyGoal,
    color,
  }) {
    await this.transactionManager.transaction(
      async ({ tenantRepository, userRepository }) => {
        const tenant = await tenantRepository.get({
          tenantId,
        });
        if (tenant === null) {
          return;
        }
        const plan = tenant.plans.find((plan) => plan.planId === planId);
        const category = plan.categories.find(
          (c) => c.categoryId === categoryId
        );
        category.name = name;
        category.monthlyGoal = monthlyGoal;

        if (color) {
          const tenantUser = tenant.users.find((user) => user.id === userId);
          tenantUser.categoryColors = tenantUser.categoryColors || {};
          tenantUser.categoryColors[categoryId] = color;

          const user = await userRepository.get({ userId });
          user.categoryColors = user.categoryColors || {};
          user.categoryColors[categoryId] = color;
          await userRepository.set({ userId, user });
        }

        await tenantRepository.set({ tenantId, tenant });
      }
    );
  }
}

export { UpdateCategoryService };
