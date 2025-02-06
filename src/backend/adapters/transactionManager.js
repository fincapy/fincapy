class TransactionManager {
  constructor({
    redisAdapter,
    tenantRepositoryFactory,
    userRepositoryFactory,
  }) {
    this.redisAdapter = redisAdapter;
    this.tenantRepositoryFactory = tenantRepositoryFactory;
    this.userRepositoryFactory = userRepositoryFactory;
  }

  async transaction(options, asyncFn) {
    let tenantRepository;
    let userRepository;
    let tenant;
    let user;
    if (!options.watchKeys) {
      options.watchKeys = [];
    }
    if (options.tenantId) {
      tenantRepository = new this.tenantRepositoryFactory({
        redisAdapter: this.redisAdapter,
      });
      tenant = await tenantRepository.get({ tenantId: options.tenantId });
    }
    if (options.userId) {
      userRepository = new this.userRepositoryFactory({
        redisAdapter: this.redisAdapter,
      });
      user = await userRepository.get({ userId: options.userId });
    }
    if (options.userEmail) {
      userRepository = new this.userRepositoryFactory({
        redisAdapter: this.redisAdapter,
      });
      user = await userRepository.getByEmail({ email: options.userEmail });
    }
    if (!tenantRepository) {
      tenantRepository = new this.tenantRepositoryFactory({
        redisAdapter: this.redisAdapter,
      });
    }
    if (!userRepository) {
      userRepository = new this.userRepositoryFactory({
        redisAdapter: this.redisAdapter,
      });
    }
    try {
      if (options.watchKeys.length > 0) {
        for (const watchKey of options.watchKeys) {
          await this.redisAdapter.watch(watchKey);
        }
      }
      await this.redisAdapter.multiNoPipeline();
      await asyncFn({
        existingTenant: tenant,
        existingUser: user,
      });
      await this.redisAdapter.exec();
    } catch (e) {
      await this.redisAdapter.discard();
      if (options.watchKeys) {
        if (options.watchKeys.length > 0) {
          await this.redisAdapter.unwatch();
        }
      }
      throw e;
    }
  }
}

export { TransactionManager };
