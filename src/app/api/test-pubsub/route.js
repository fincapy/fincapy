import { PubSubAdapter, pubSubClient } from '@/backend/adapters/pubsub';

export const POST = async (req) => {
  const adapter = new PubSubAdapter(pubSubClient);
  await adapter.publish({
    topicName: 'transactions-new-customer',
    data: {
      message: 'Hello World',
    },
  });

  return new Response(JSON.stringify({ message: 'Success' }), { status: 200 });
};
