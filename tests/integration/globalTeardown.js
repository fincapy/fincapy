import { redisClient } from '@/backend/adapters/redisAdapter';

export default async () => {
  console.log('Running global teardown...');
  // Perform cleanup logic here
  await redisClient.flushall();
};
