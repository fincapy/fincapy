import { redisClient } from '@/backend/adapters/redisAdapter';
import { afterEach } from 'vitest';

afterEach(async () => {
  // console.log('Flushing Redis');
  // await redisClient.flushall();
});
