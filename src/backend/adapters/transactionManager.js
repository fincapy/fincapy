import { RedisLuaTransactionBuilder } from './redisAdapter';

class TransactionManager {
  constructor({
    redisAdapter,
    tenantRepositoryFactory,
    userRepositoryFactory,
    sessionRepositoryFactory,
    emailVerificationCodeRepositoryFactory,
  }) {
    this.redisAdapter = redisAdapter;
    this.tenantRepositoryFactory = tenantRepositoryFactory;
    this.userRepositoryFactory = userRepositoryFactory;
    this.sessionRepositoryFactory = sessionRepositoryFactory;
    this.emailVerificationCodeRepositoryFactory =
      emailVerificationCodeRepositoryFactory;
  }

  async transaction(asyncFn) {
    const transactionBuilder = new RedisLuaTransactionBuilder();
    const tenantRepository = new this.tenantRepositoryFactory({
      redisAdapter: this.redisAdapter,
      transactionBuilder,
    });
    const userRepository = new this.userRepositoryFactory({
      redisAdapter: this.redisAdapter,
      transactionBuilder,
    });
    const sessionRepository = new this.sessionRepositoryFactory({
      redisAdapter: this.redisAdapter,
      transactionBuilder,
    });
    const emailVerificationCodeRepository =
      new this.emailVerificationCodeRepositoryFactory({
        redisAdapter: this.redisAdapter,
        transactionBuilder,
      });
    await asyncFn({
      tenantRepository,
      userRepository,
      sessionRepository,
      emailVerificationCodeRepository,
    });
    const { script, args } = transactionBuilder.generateScript();
    await this.redisAdapter.executeLuaScript(
      script,
      transactionBuilder.versionKey,
      args
    );
  }
}

export { TransactionManager };
