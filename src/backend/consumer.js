import { RedisAdapter, redisClient } from './adapters/redisAdapter.js';
import { IngestTransactionUpdatesService } from './services/ingestTransactionUpdatesService.js';
import { OpenaiAdapter } from './adapters/openaiAdapter.js';
import { TenantRepository } from './adapters/repositories/TenantRepository.js';
import { PlaidAdapter, client } from './adapters/plaid.js';
import { MessageRepository } from './adapters/repositories/messageRepository.js';
import {
  STREAM_NAME,
  GROUP_NAME,
  CONSUMER_NAME,
} from './streamingConstants.js';

let isStopping = false;

class Consumer {
  constructor({ messageRepository, redisAdapter, service }) {
    this.redisAdapter = redisAdapter;
    this.messageRepository = messageRepository;
    this.service = service;
  }

  async consume() {
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
  const redisAdapter = new RedisAdapter({ redisClient });
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
  consumer.consume();
})();
