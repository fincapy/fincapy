import { redisClient } from '@/backend/adapters/redisAdapter';

async function flushRedis() {
  await redisClient.flushall();
}

process.on('exit', () => {
  console.log('Flushing Redis');
  flushRedis();
});
