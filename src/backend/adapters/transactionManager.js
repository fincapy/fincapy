import { RedisLuaTransactionBuilder } from './redisAdapter.js';
import { MessageRepository } from './repositories/messageRepository.js';
import { TenantRepository } from './repositories/TenantRepository.js';
import { UserRepository } from './repositories/userRepository.js';
import { SessionRepository } from './repositories/sessionRepository.js';
import { EmailVerificationCodeRepository } from './repositories/emailVerificationCodeRepository.js';
import { RedisAdapter, redisClient } from './redisAdapter.js';
import {
  CONSUMER_NAME,
  GROUP_NAME,
  STREAM_NAME,
} from '../streamingConstants.js';

class TransactionManager {
  async transaction(asyncFn) {
    const transactionBuilder = new RedisLuaTransactionBuilder();
    const redisAdapter = new RedisAdapter({ redisClient });
    const tenantRepository = new TenantRepository({
      redisAdapter,
      transactionBuilder,
    });
    const userRepository = new UserRepository({
      redisAdapter,
      transactionBuilder,
    });
    const sessionRepository = new SessionRepository({
      redisAdapter,
      transactionBuilder,
    });
    const messageRepository = new MessageRepository({
      redisAdapter,
      transactionBuilder,
      streamName: STREAM_NAME,
      groupName: GROUP_NAME,
      consumerName: CONSUMER_NAME,
    });
    const emailVerificationCodeRepository = new EmailVerificationCodeRepository(
      {
        redisAdapter,
        transactionBuilder,
      }
    );
    await asyncFn({
      tenantRepository,
      userRepository,
      sessionRepository,
      messageRepository,
      emailVerificationCodeRepository,
    });
    const { script, keys, args } = transactionBuilder.generateScript();
    console.log('script', script);
    console.log('args', args);
    await redisAdapter.executeLuaScript(script, keys, args);
  }
}

export { TransactionManager };
