import { RedisAdapter } from './adapters/redisAdapter.js';
import { IngestTransactionUpdatesService } from './services/ingestTransactionUpdatesService.js';
import { OpenaiAdapter } from './adapters/openaiAdapter.js';
import { TenantRepository } from './adapters/repositories/TenantRepository.js';
import { PlaidAdapter, client } from './adapters/plaid.js';
import { MessageRepository } from './adapters/repositories/messageRepository.js';
import { TriggerTransactionIngestForAllTenants } from './services/triggerTransactionIngestForAllTenants.js';
import { TransactionManager } from './adapters/transactionManager.js';
import {
  STREAM_NAME,
  GROUP_NAME,
  CONSUMER_NAME,
} from './streamingConstants.js';
import { LRUCache } from 'lru-cache';
import Redis from 'ioredis';

let isStopping = false;

class CronProducer {
  constructor({ service }) {
    this.service = service;
  }

  async scheduleTaskInMountainTime(taskFunction, executionTime) {
    let hasExecutedToday = false;

    // Function to check if current time is within the target window
    function isWithinTimeWindow() {
      const mtTime = new Date().toLocaleString('en-US', {
        timeZone: 'America/Denver',
      });
      const mtDate = new Date(mtTime);
      const hour = mtDate.getHours();
      return hour >= executionTime && hour < executionTime + 1;
    }

    // Function to check if it's a new day (after 3am MT)
    function isNewDay() {
      const mtTime = new Date().toLocaleString('en-US', {
        timeZone: 'America/Denver',
      });
      const mtDate = new Date(mtTime);
      const hour = mtDate.getHours();
      return hour >= executionTime + 1; // Reset flag after 3am
    }

    while (true) {
      if (isWithinTimeWindow() && !hasExecutedToday) {
        await taskFunction();
        console.log('Task executed');
        hasExecutedToday = true;
      }

      if (isNewDay()) {
        hasExecutedToday = false; // Reset flag for the next day
      }

      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
    }
  }

  async produce() {
    await this.scheduleTaskInMountainTime(
      async () => await this.service.execute(),
      2
    );
  }
}

class Consumer {
  constructor({ messageRepository, redisAdapter, service }) {
    this.redisAdapter = redisAdapter;
    this.messageRepository = messageRepository;
    this.service = service;
    this.messagesSeen = new LRUCache({ max: 1 });
  }

  async monitor() {
    let messageId;
    while (!isStopping) {
      const mostRecent = this.messagesSeen.get('mostRecent');
      if (mostRecent) {
        const now = new Date();
        const diff = now.getTime() - mostRecent.time.getTime();
        if (diff > 2000 && (messageId !== mostRecent.messageId || !messageId)) {
          console.log('No new messages received in 2 secs');
          messageId = mostRecent.messageId;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  async consume() {
    console.log('Starting consumer');
    this.redisAdapter.createConsumerGroup(STREAM_NAME, GROUP_NAME);
    while (!isStopping) {
      try {
        // First, try to process pending messages (if any)
        const pendingMessages = await this.messageRepository.getSome({
          count: 10,
          readPending: true,
        });

        for (const envelope of pendingMessages) {
          await this.service.execute(envelope.message);
          await this.messageRepository.acknowledge(envelope.messageId);
          this.messagesSeen.set('mostRecent', {
            time: new Date(),
            messageId: envelope.messageId,
          });
        }

        const newMessages = await this.messageRepository.getSome({
          count: 10,
          readPending: false,
        });

        for (const envelope of newMessages) {
          await this.service.execute(envelope.message);
          await this.messageRepository.acknowledge({
            messageId: envelope.messageId,
          });
          this.messagesSeen.set('mostRecent', {
            time: new Date(),
            messageId: envelope.messageId,
          });
        }
      } catch (err) {
        console.error('Error consuming messages:', err);
      }
    }
  }
}

process.on('SIGINT', () => {
  console.log('Received SIGINT (Ctrl+C), stopping...');
  isStopping = true;
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, stopping...');
  isStopping = true;
});

(async function main() {
  const consumerRedisClient = new Redis(process.env.REDIS_URL);
  const redisAdapter = new RedisAdapter({ redisClient: consumerRedisClient });
  const messageRepository = new MessageRepository({
    redisAdapter,
    streamName: STREAM_NAME,
    groupName: GROUP_NAME,
    consumerName: CONSUMER_NAME,
  });
  const plaidAdapter = new PlaidAdapter(client);
  const openaiAdapter = new OpenaiAdapter();
  const tenantRepository = new TenantRepository({ redisAdapter });
  const service = new IngestTransactionUpdatesService({
    plaidAdapter,
    tenantRepository,
    openaiAdapter,
  });
  const consumer = new Consumer({
    service,
    redisAdapter,
    messageRepository,
  });
  const transactionManager = new TransactionManager();
  const triggerService = new TriggerTransactionIngestForAllTenants({
    transactionManager,
  });
  const cronProducer = new CronProducer({ service: triggerService });
  await Promise.all([
    consumer.consume(),
    consumer.monitor(),
    cronProducer.produce(),
  ]);
})();
