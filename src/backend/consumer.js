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
import { SendUserInviteEmailService } from './services/sendUserInviteEmailService.js';
import { SESAdapter } from './adapters/sesAdapter.js';

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
  constructor({
    messageRepository,
    redisAdapter,
    ingestService,
    emailService,
  }) {
    this.redisAdapter = redisAdapter;
    this.messageRepository = messageRepository;
    this.ingestService = ingestService;
    this.emailService = emailService;
  }

  async consume() {
    console.log('Starting consumer');
    await this.redisAdapter.createConsumerGroup(STREAM_NAME, GROUP_NAME);
    while (!isStopping) {
      try {
        // First, try to process pending messages (if any)
        console.log('reading pending messages');
        const pendingMessages = await this.messageRepository.getSome({
          count: 10,
          readPending: true,
        });

        for (const envelope of pendingMessages) {
          if (
            envelope.message.payload.eventType === 'PLAID_ITEM_UPDATED' ||
            envelope.message.payload.eventType ===
              'TRANSACTION_INGEST_REQUESTED' ||
            envelope.message.payload.eventType === 'PLAID_ITEM_CREATED'
          ) {
            await this.ingestService.execute(envelope.message.payload);
            await this.messageRepository.acknowledge({
              messageId: envelope.messageId,
            });
          }

          if (envelope.message.payload.eventType === 'USER_CREATED') {
            await this.emailService.execute(envelope.message.payload);
            await this.messageRepository.acknowledge({
              messageId: envelope.messageId,
            });
          }
        }

        console.log('reading new messages');
        const newMessages = await this.messageRepository.getSome({
          count: 10,
          readPending: false,
        });

        for (const envelope of newMessages) {
          if (
            envelope.message.payload.eventType === 'PLAID_ITEM_UPDATED' ||
            envelope.message.payload.eventType ===
              'TRANSACTION_INGEST_REQUESTED' ||
            envelope.message.payload.eventType === 'PLAID_ITEM_CREATED'
          ) {
            try {
              await this.ingestService.execute(envelope.message.payload);
            } catch (err) {
              console.error('Error processing message:', err);
            }
            await this.messageRepository.acknowledge({
              messageId: envelope.messageId,
            });
          }

          if (envelope.message.payload.eventType === 'USER_CREATED') {
            try {
              await this.emailService.execute(envelope.message.payload);
            } catch (err) {
              console.error('Error processing message:', err);
            }
            await this.messageRepository.acknowledge({
              messageId: envelope.messageId,
            });
          }
          await this.messageRepository.acknowledge({
            messageId: envelope.messageId,
          });
        }
      } catch (err) {
        console.error('Error consuming messages:', err);
        if (err.message.includes('NOGROUP')) {
          await this.redisAdapter.createConsumerGroup(STREAM_NAME, GROUP_NAME);
        }
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
  const options = {};
  if (process.env.NODE_ENV === 'production') {
    options.family = 6;
  }
  const consumerRedisClient = new Redis(process.env.REDIS_URL, options);
  const redisAdapter = new RedisAdapter({ redisClient: consumerRedisClient });
  const messageRepository = new MessageRepository({
    redisAdapter,
    streamName: STREAM_NAME,
    groupName: GROUP_NAME,
    consumerName: CONSUMER_NAME,
  });
  const plaidAdapter = new PlaidAdapter(client);
  const openaiAdapter = new OpenaiAdapter();
  const transactionManager = new TransactionManager();
  const ingestService = new IngestTransactionUpdatesService({
    plaidAdapter,
    transactionManager,
    openaiAdapter,
  });
  const sesAdapter = new SESAdapter();
  const emailService = new SendUserInviteEmailService({ sesAdapter });
  const consumer = new Consumer({
    ingestService,
    emailService,
    redisAdapter,
    messageRepository,
  });
  const triggerService = new TriggerTransactionIngestForAllTenants({
    transactionManager,
  });
  const cronProducer = new CronProducer({ service: triggerService });
  await Promise.all([consumer.consume(), cronProducer.produce()]);
})();
